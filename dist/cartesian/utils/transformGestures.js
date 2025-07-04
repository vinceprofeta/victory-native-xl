"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollTransformGesture = exports.panTransformGesture = exports.pinchTransformGesture = void 0;
const react_native_gesture_handler_1 = require("react-native-gesture-handler");
const react_native_skia_1 = require("@shopify/react-native-skia");
const react_native_reanimated_1 = require("react-native-reanimated");
const pinchTransformGesture = (state, _config = {}) => {
    const defaults = {
        enabled: true,
        dimensions: ["x", "y"],
    };
    const config = Object.assign(Object.assign({}, defaults), _config);
    const dimensions = Array.isArray(config.dimensions)
        ? config.dimensions
        : [config.dimensions];
    const scaleX = dimensions.includes("x");
    const scaleY = dimensions.includes("y");
    const pinch = react_native_gesture_handler_1.Gesture.Pinch()
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
        state.matrix.value = (0, react_native_skia_1.multiply4)(state.offset.value, (0, react_native_skia_1.scale)(scaleX ? e.scale : 1, scaleY ? e.scale : 1, 1, state.origin.value));
    })
        .onEnd(() => {
        state.zoomActive.value = false;
    });
    return pinch;
};
exports.pinchTransformGesture = pinchTransformGesture;
const panTransformGesture = (state, _config = {}) => {
    const defaults = {
        enabled: true,
        dimensions: ["x", "y"],
    };
    const config = Object.assign(Object.assign({}, defaults), _config);
    const dimensions = Array.isArray(config.dimensions)
        ? config.dimensions
        : [config.dimensions];
    const panX = dimensions.includes("x");
    const panY = dimensions.includes("y");
    const pan = react_native_gesture_handler_1.Gesture.Pan()
        .onStart(() => {
        state.panActive.value = true;
    })
        .onChange((e) => {
        state.matrix.value = (0, react_native_skia_1.multiply4)((0, react_native_skia_1.translate)(panX ? e.changeX : 0, panY ? e.changeY : 0, 0), state.matrix.value);
    })
        .onEnd(() => {
        state.panActive.value = false;
    });
    if (config.activateAfterLongPress !== undefined) {
        pan.activateAfterLongPress(config.activateAfterLongPress);
    }
    return pan;
};
exports.panTransformGesture = panTransformGesture;
const springConfig = {
    damping: 15,
    mass: 1,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};
const scrollTransformGesture = ({ scrollX, prevTranslateX, viewportWidth, dimensions, onScroll, }) => {
    const panGesture = react_native_gesture_handler_1.Gesture.Pan()
        .activeOffsetX([-10, 10])
        .onStart(() => {
        (0, react_native_reanimated_1.cancelAnimation)(scrollX);
        prevTranslateX.value = scrollX.value;
    })
        .onChange((e) => {
        const chartWidth = dimensions.width || 300;
        const change = e.changeX / chartWidth;
        if (onScroll)
            (0, react_native_reanimated_1.runOnJS)(onScroll)({
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
        }
        else if (potentialNewValue > maxScroll) {
            const overscroll = potentialNewValue - maxScroll;
            const dampedOverscroll = overscroll * rubberBandFactor;
            scrollX.value = maxScroll + dampedOverscroll;
        }
        else {
            scrollX.value = potentialNewValue;
        }
    })
        .onEnd((e) => {
        const viewportWidth = dimensions.width || 300;
        const width = dimensions.totalContentWidth || 300;
        const maxScroll = Math.max(0, width - viewportWidth + 45);
        const currentScroll = scrollX.value;
        if (currentScroll < 0) {
            scrollX.value = (0, react_native_reanimated_1.withSpring)(0, springConfig);
        }
        else if (currentScroll > maxScroll) {
            scrollX.value = (0, react_native_reanimated_1.withSpring)(maxScroll, springConfig);
        }
        else {
            const decayMaxScroll = width - viewportWidth + 45;
            scrollX.value = (0, react_native_reanimated_1.withDecay)({
                velocity: -e.velocityX,
                clamp: [0, decayMaxScroll],
            });
        }
    });
    return panGesture;
};
exports.scrollTransformGesture = scrollTransformGesture;
