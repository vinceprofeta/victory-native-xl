import { Skia, type SkPath } from "@shopify/react-native-skia";
import * as React from "react";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
  type WithDecayConfig,
  type WithSpringConfig,
  type WithTimingConfig,
} from "react-native-reanimated";

export type PathAnimationConfig =
  | ({ type: "timing" } & WithTimingConfig)
  | ({ type: "spring" } & WithSpringConfig)
  | ({ type: "decay" } & WithDecayConfig);

function isWithDecayConfig(
  config: PathAnimationConfig,
): config is WithDecayConfig & { type: "decay" } {
  return config.type === "decay";
}

function isWithTimingConfig(
  config: PathAnimationConfig,
): config is WithTimingConfig & { type: "timing" } {
  return config.type === "timing";
}

function isWithSpringConfig(
  config: PathAnimationConfig,
): config is WithSpringConfig & { type: "spring" } {
  return config.type === "spring";
}

export const useAnimatedPath = (
  path: SkPath,
  animConfig: PathAnimationConfig = { type: "timing", duration: 300 },
) => {
  const t = useSharedValue(0);
  const prevPath = useSharedValue(path);

  React.useEffect(() => {
    t.value = 0;

    const callback = (finished?: boolean) => {
      if (finished) {
        // When the animation is complete, update prevPath to the current path
        // so that the next animation starts from the correct spot.
        runOnJS(setPrevPath)(path);
      }
    };
    if (isWithTimingConfig(animConfig)) {
      t.value = withTiming(1, animConfig, callback);
    } else if (isWithSpringConfig(animConfig)) {
      t.value = withSpring(1, animConfig, callback);
    } else if (isWithDecayConfig(animConfig)) {
      t.value = withDecay(animConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, animConfig, t]);

  const setPrevPath = (newPath: SkPath) => {
    prevPath.value = newPath;
  };

  const currentPath = useDerivedValue<SkPath>(() => {
    if (t.value !== 1) {
      // Match floating-point numbers in a string and normalize their precision as this is essential for Skia to interpolate paths
      // Without normalization, Skia won't be able to interpolate paths in Pie slice shapes
      // This normalization is really only needed for pie charts at the moment
      const normalizePrecision = (p: string): string =>
        p.replace(/(\d+\.\d+)/g, (match) =>
          Number.parseFloat(match).toFixed(3),
        );
      const pathNormalized = Skia.Path.MakeFromSVGString(
        normalizePrecision(path.toSVGString()),
      );
      const prevPathNormalized = Skia.Path.MakeFromSVGString(
        normalizePrecision(prevPath.value.toSVGString()),
      );

      if (
        pathNormalized &&
        prevPathNormalized &&
        pathNormalized.isInterpolatable(prevPathNormalized)
      ) {
        return pathNormalized.interpolate(prevPathNormalized, t.value) || path;
      }
    }

    return path;
  });

  return currentPath;
};
