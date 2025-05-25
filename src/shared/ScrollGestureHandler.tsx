import {
  type ComposedGesture,
  GestureDetector,
  type GestureType,
} from "react-native-gesture-handler";
import type { SkRect } from "@shopify/react-native-skia";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import * as React from "react";

type GestureHandlerProps = {
  gesture: ComposedGesture | GestureType;
  dimensions: SkRect;
  debug?: boolean;
  derivedScrollX?: SharedValue<number>;
};

export const ScrollGestureHandler = ({
  gesture,
  dimensions,
  debug = false,
}: GestureHandlerProps) => {
  const { x, y, width, height } = dimensions;

  const style = useAnimatedStyle(() => {
    "worklet";
    return {
      position: "absolute",
      backgroundColor: debug ? "rgba(100, 200, 300, 0.4)" : "transparent",
      left: x,
      top: y,
      width,
      height,
    };
  }, [x, y, width, height]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} />
    </GestureDetector>
  );
};
