import { type ComposedGesture, type GestureType } from "react-native-gesture-handler";
import type { SkRect } from "@shopify/react-native-skia";
import { type SharedValue } from "react-native-reanimated";
import * as React from "react";
type GestureHandlerProps = {
    gesture: ComposedGesture | GestureType;
    dimensions: SkRect;
    debug?: boolean;
    derivedScrollX?: SharedValue<number>;
};
export declare const ScrollGestureHandler: ({ gesture, dimensions, debug, }: GestureHandlerProps) => React.JSX.Element;
export {};
