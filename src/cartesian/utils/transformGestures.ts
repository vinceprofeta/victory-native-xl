import {
  Gesture,
  type PanGesture,
  type PinchGesture,
} from "react-native-gesture-handler";
import { multiply4, scale, translate } from "@shopify/react-native-skia";
import type { PanGestureConfig } from "react-native-gesture-handler/lib/typescript/handlers/PanGestureHandler";
import type { ChartTransformState } from "../hooks/useChartTransformState";
import {
  withDecay,
  cancelAnimation,
  type SharedValue,
  runOnJS,
  withSpring,
} from "react-native-reanimated";

type Dimension = "x" | "y";

export type PinchTransformGestureConfig = {
  enabled?: boolean;
  dimensions?: Dimension | Dimension[];
};
export const pinchTransformGesture = (
  state: ChartTransformState,
  _config: PinchTransformGestureConfig = {},
): PinchGesture => {
  const defaults: PinchTransformGestureConfig = {
    enabled: true,
    dimensions: ["x", "y"],
  };
  const config = { ...defaults, ..._config };
  const dimensions = Array.isArray(config.dimensions)
    ? config.dimensions
    : [config.dimensions];
  const scaleX = dimensions.includes("x");
  const scaleY = dimensions.includes("y");

  const pinch = Gesture.Pinch()
    .onBegin((e) => {
      state.offset.value = state.matrix.value;
      state.origin.value = {
        x: e.focalX,
        y: e.focalY,
      };
    })
    .onStart(() => {
      state.zoomActive.value = true;
    })
    .onChange((e) => {
      state.matrix.value = multiply4(
        state.offset.value,
        scale(
          scaleX ? e.scale : 1,
          scaleY ? e.scale : 1,
          1,
          state.origin.value,
        ),
      );
    })
    .onEnd(() => {
      state.zoomActive.value = false;
    });

  return pinch;
};

export type PanTransformGestureConfig = {
  enabled?: boolean;
  dimensions?: Dimension | Dimension[];
} & Pick<PanGestureConfig, "activateAfterLongPress">;
export const panTransformGesture = (
  state: ChartTransformState,
  _config: PanTransformGestureConfig = {},
): PanGesture => {
  const defaults: PanTransformGestureConfig = {
    enabled: true,
    dimensions: ["x", "y"],
  };
  const config = { ...defaults, ..._config };
  const dimensions = Array.isArray(config.dimensions)
    ? config.dimensions
    : [config.dimensions];
  const panX = dimensions.includes("x");
  const panY = dimensions.includes("y");

  const pan = Gesture.Pan()
    .onStart(() => {
      state.panActive.value = true;
    })
    .onChange((e) => {
      state.matrix.value = multiply4(
        translate(panX ? e.changeX : 0, panY ? e.changeY : 0, 0),
        state.matrix.value,
      );
    })
    .onEnd(() => {
      state.panActive.value = false;
    });

  if (config.activateAfterLongPress !== undefined) {
    pan.activateAfterLongPress(config.activateAfterLongPress);
  }

  return pan;
};

const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 100,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

export const scrollTransformGesture = ({
  scrollX,
  prevTranslateX,
  viewportWidth,
  dimensions,
  onScroll,
}: {
  scrollX: SharedValue<number>;
  prevTranslateX: SharedValue<number>;
  viewportWidth: number;
  dimensions: Partial<{ totalContentWidth: number; width: number }>;
  onScroll?: (data: any) => void;
}): PanGesture => {
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onStart(() => {
      cancelAnimation(scrollX);
      prevTranslateX.value = scrollX.value;
    })
    .onChange((e) => {
      const chartWidth = dimensions.width || 300;
      const change = e.changeX / chartWidth;
      if (onScroll)
        runOnJS(onScroll)({
          change,
        });
    })
    .onUpdate((e) => {
      const viewportWidth = dimensions.width || 300;
      const width = (dimensions.totalContentWidth || 300) + 30;
      const maxScroll = width - viewportWidth;
      const potentialNewValue = prevTranslateX.value - e.translationX;
      const rubberBandFactor = 0.55;

      if (potentialNewValue < 0) {
        const overscroll = -potentialNewValue;
        const dampedOverscroll = overscroll * rubberBandFactor;
        scrollX.value = -dampedOverscroll;
      } else if (potentialNewValue > maxScroll) {
        const overscroll = potentialNewValue - maxScroll;
        const dampedOverscroll = overscroll * rubberBandFactor;
        scrollX.value = maxScroll + dampedOverscroll;
      } else {
        scrollX.value = potentialNewValue;
      }
    })

    .onEnd((e) => {
      const viewportWidth = dimensions.width || 300;
      const width = dimensions.totalContentWidth || 300;
      const maxScroll = Math.max(0, width - viewportWidth + 45);
      const currentScroll = scrollX.value;

      if (currentScroll < 0) {
        scrollX.value = withSpring(0, springConfig);
      } else if (currentScroll > maxScroll) {
        scrollX.value = withSpring(maxScroll, springConfig);
      } else {
        const decayMaxScroll = width - viewportWidth + 45;
        scrollX.value = withDecay({
          velocity: -e.velocityX,
          clamp: [0, decayMaxScroll],
        });
      }
    });

  return panGesture;
};
