"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnimatedPath = void 0;
const react_native_skia_1 = require("@shopify/react-native-skia");
const React = __importStar(require("react"));
const react_native_reanimated_1 = require("react-native-reanimated");
function isWithDecayConfig(config) {
    return config.type === "decay";
}
function isWithTimingConfig(config) {
    return config.type === "timing";
}
function isWithSpringConfig(config) {
    return config.type === "spring";
}
const useAnimatedPath = (path, animConfig = { type: "timing", duration: 300 }) => {
    const t = (0, react_native_reanimated_1.useSharedValue)(0);
    const [prevPath, setPrevPath] = React.useState(path);
    React.useEffect(() => {
        t.value = 0;
        if (isWithTimingConfig(animConfig)) {
            t.value = (0, react_native_reanimated_1.withTiming)(1, animConfig);
        }
        else if (isWithSpringConfig(animConfig)) {
            t.value = (0, react_native_reanimated_1.withSpring)(1, animConfig);
        }
        else if (isWithDecayConfig(animConfig)) {
            t.value = (0, react_native_reanimated_1.withDecay)(animConfig);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, t]);
    const currentPath = (0, react_native_reanimated_1.useDerivedValue)(() => {
        if (t.value !== 1) {
            // Match floating-point numbers in a string and normalize their precision as this is essential for Skia to interpolate paths
            // Without normalization, Skia won't be able to interpolate paths in Pie slice shapes
            // This normalization is really only needed for pie charts at the moment
            const normalizePrecision = (path) => path.replace(/(\d+\.\d+)/g, (match) => parseFloat(match).toFixed(3));
            const pathNormalized = react_native_skia_1.Skia.Path.MakeFromSVGString(normalizePrecision(path.toSVGString()));
            const prevPathNormalized = react_native_skia_1.Skia.Path.MakeFromSVGString(normalizePrecision(prevPath.toSVGString()));
            if (pathNormalized &&
                prevPathNormalized &&
                pathNormalized.isInterpolatable(prevPathNormalized)) {
                return pathNormalized.interpolate(prevPathNormalized, t.value) || path;
            }
        }
        return path;
    });
    React.useEffect(() => {
        setPrevPath(currentPath.value);
    }, [currentPath, path]);
    return currentPath;
};
exports.useAnimatedPath = useAnimatedPath;
