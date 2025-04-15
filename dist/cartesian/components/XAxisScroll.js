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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XAxisDefaults = exports.XAxis = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_skia_1 = require("@shopify/react-native-skia");
const getOffsetFromAngle_1 = require("../../utils/getOffsetFromAngle");
const boundsToClip_1 = require("../../utils/boundsToClip");
const tickHelpers_1 = require("../../utils/tickHelpers");
const react_native_reanimated_1 = require("react-native-reanimated");
const react_fast_compare_1 = __importDefault(require("react-fast-compare"));
const XAxis = ({ xScale: xScaleProp, ignoreClip, yScale, axisSide = "bottom", yAxisSide = "left", labelPosition = "outset", labelRotate, tickCount = tickHelpers_1.DEFAULT_TICK_COUNT, tickValues, labelOffset = 2, labelColor = "#000000", lineWidth = react_native_1.StyleSheet.hairlineWidth, lineColor = "hsla(0, 0%, 0%, 0.25)", font, formatXLabel = (label) => String(label), ix = [], isNumericalData, linePathEffect, chartBounds, enableRescaling, zoom, scrollX, onVisibleTicksChange, }) => {
    var _a;
    const transformX = (0, react_native_reanimated_1.useDerivedValue)(() => {
        "worklet";
        return [{ translateX: -scrollX.value }];
    }, [scrollX]);
    // Create a mapping of unique values to their first occurrence index
    const uniqueValueIndices = (0, react_1.useMemo)(() => {
        return ix.reduce((acc, val, index) => {
            if (!acc.has(String(val))) {
                acc.set(String(val), index);
            }
            return acc;
        }, new Map());
    }, [ix]);
    const xScale = (0, react_1.useMemo)(() => (zoom ? zoom.rescaleX(xScaleProp) : xScaleProp), [zoom, xScaleProp]);
    const [y1 = 0, y2 = 0] = yScale.domain();
    const fontSize = (_a = font === null || font === void 0 ? void 0 : font.getSize()) !== null && _a !== void 0 ? _a : 0;
    // Use tickValues if provided, otherwise generate ticks
    const xTicksNormalized = (0, react_1.useMemo)(() => tickValues
        ? (0, tickHelpers_1.downsampleTicks)(tickValues, tickCount)
        : enableRescaling
            ? xScale.ticks(tickCount)
            : xScaleProp.ticks(tickCount), [tickValues, tickCount, enableRescaling, xScale, xScaleProp]);
    // Ref to store the last reported visible ticks on the JS thread
    const lastReportedVisibleTicksRef = (0, react_1.useRef)(null);
    // --- Optimal Visible Ticks Reaction ---
    const scaleDomain = (0, react_1.useMemo)(() => xScale.domain(), [xScale]);
    const scaleRange = (0, react_1.useMemo)(() => xScale.range(), [xScale]);
    // Memoize the JS processing function reference
    const processAndReportTicks = (0, react_1.useMemo)(() => {
        // This function runs on the JS thread via runOnJS
        return () => {
            if (!onVisibleTicksChange)
                return;
            // Recalculate the full list accurately on JS thread
            const actualVisibleData = [];
            const currentScrollX = scrollX.value; // Read latest scroll value
            xTicksNormalized.forEach((tick) => {
                var _a;
                const numericTick = Number(tick);
                if (Number.isNaN(numericTick))
                    return;
                // Use the JS scale here
                const tickPixelX = xScale(numericTick);
                const scrolledPixelX = tickPixelX - currentScrollX;
                if (scrolledPixelX >= chartBounds.left &&
                    scrolledPixelX <= chartBounds.right) {
                    const indexPosition = (_a = uniqueValueIndices.get(String(tick))) !== null && _a !== void 0 ? _a : tick;
                    const dataValue = (isNumericalData ? tick : ix[indexPosition]);
                    actualVisibleData.push(dataValue);
                }
            });
            // Compare with previous and call callback if changed
            if (!(0, react_fast_compare_1.default)(lastReportedVisibleTicksRef.current, actualVisibleData)) {
                lastReportedVisibleTicksRef.current = actualVisibleData; // Update ref
                onVisibleTicksChange(actualVisibleData); // Call the user's callback
            }
        };
    }, [
        onVisibleTicksChange,
        scrollX, // Include scrollX to read latest value inside
        xTicksNormalized,
        xScale, // Use JS Scale
        chartBounds,
        uniqueValueIndices,
        isNumericalData,
        ix,
    ]);
    // React to scroll changes on UI thread
    (0, react_native_reanimated_1.useAnimatedReaction)(() => {
        // Prepare: Calculate first/last visible tick heuristic
        "worklet";
        const [d0, d1] = scaleDomain;
        const [r0, r1] = scaleRange;
        const domainSpan = d1 - d0;
        const scaleWorklet = (value) => {
            if (domainSpan === 0)
                return r0;
            return r0 + ((value - d0) / domainSpan) * (r1 - r0);
        };
        let firstVisibleTick = null;
        let lastVisibleTick = null;
        for (const tick of xTicksNormalized) {
            const numericTick = Number(tick);
            if (Number.isNaN(numericTick))
                continue;
            const tickPixelX = scaleWorklet(numericTick);
            const scrolledPixelX = tickPixelX - scrollX.value;
            if (scrolledPixelX >= chartBounds.left &&
                scrolledPixelX <= chartBounds.right) {
                if (firstVisibleTick === null) {
                    firstVisibleTick = tick; // Found the first one
                }
                lastVisibleTick = tick; // Keep updating last one found in range
            }
            else if (firstVisibleTick !== null) {
                // Optimization: if we found the first and are now past the right bound, we can stop.
                // Requires ticks to be sorted, which xScale.ticks() usually ensures.
                if (scrolledPixelX > chartBounds.right)
                    break;
            }
        }
        // Return the heuristic value
        return { first: firstVisibleTick, last: lastVisibleTick };
    }, (current, previous) => {
        // React: Trigger JS processing only if heuristic changes
        "worklet";
        // Trigger if previous is null or if first/last differs
        if (previous === null ||
            current.first !== previous.first ||
            current.last !== previous.last) {
            (0, react_native_reanimated_1.runOnJS)(processAndReportTicks)();
        }
    }, 
    // Dependencies for the reaction prepare block
    [
        scrollX,
        scaleDomain,
        scaleRange,
        chartBounds,
        xTicksNormalized,
        processAndReportTicks,
    ]);
    const xAxisNodes = xTicksNormalized.map((tick, index) => {
        var _a, _b, _c;
        // Use the first occurrence index for positioning if available
        const indexPosition = (_a = uniqueValueIndices.get(String(tick))) !== null && _a !== void 0 ? _a : tick;
        const tickPosition = tick;
        const p1 = (0, react_native_skia_1.vec)(xScale(tickPosition), yScale(y2));
        const p2 = (0, react_native_skia_1.vec)(xScale(tickPosition), yScale(y1));
        const val = isNumericalData ? tick : ix[indexPosition];
        const contentX = formatXLabel(val);
        const labelWidth = (_c = (_b = font === null || font === void 0 ? void 0 : font.getGlyphWidths) === null || _b === void 0 ? void 0 : _b.call(font, font.getGlyphIDs(contentX)).reduce((sum, value) => sum + value, 0)) !== null && _c !== void 0 ? _c : 0;
        // const labelX = xScale(indexPosition) - (labelWidth ?? 0) / 2 - this does not work when the viewport is not [0,N] AND IS [N,N]
        const labelX = xScale(tick) - (labelWidth !== null && labelWidth !== void 0 ? labelWidth : 0) / 2;
        const canFitLabelContent = true;
        const labelY = (() => {
            // bottom, outset
            if (axisSide === "bottom" && labelPosition === "outset") {
                return chartBounds.bottom + labelOffset + fontSize;
            }
            // bottom, inset
            if (axisSide === "bottom" && labelPosition === "inset") {
                return yScale(y2) - labelOffset;
            }
            // top, outset
            if (axisSide === "top" && labelPosition === "outset") {
                return yScale(y1) - labelOffset;
            }
            // top, inset
            return yScale(y1) + fontSize + labelOffset;
        })();
        // Calculate origin and translate for label rotation
        const { origin, rotateOffset } = (() => {
            let rotateOffset = 0;
            let origin;
            // return defaults if no labelRotate is provided
            if (!labelRotate)
                return { origin, rotateOffset };
            if (axisSide === "bottom" && labelPosition === "outset") {
                // bottom, outset
                origin = (0, react_native_skia_1.vec)(labelX + labelWidth / 2, labelY);
                rotateOffset = Math.abs((labelWidth / 2) * (0, getOffsetFromAngle_1.getOffsetFromAngle)(labelRotate));
            }
            else if (axisSide === "bottom" && labelPosition === "inset") {
                // bottom, inset
                origin = (0, react_native_skia_1.vec)(labelX + labelWidth / 2, labelY);
                rotateOffset = -Math.abs((labelWidth / 2) * (0, getOffsetFromAngle_1.getOffsetFromAngle)(labelRotate));
            }
            else if (axisSide === "top" && labelPosition === "inset") {
                // top, inset
                origin = (0, react_native_skia_1.vec)(labelX + labelWidth / 2, labelY - fontSize / 4);
                rotateOffset = Math.abs((labelWidth / 2) * (0, getOffsetFromAngle_1.getOffsetFromAngle)(labelRotate));
            }
            else {
                // top, outset
                origin = (0, react_native_skia_1.vec)(labelX + labelWidth / 2, labelY - fontSize / 4);
                rotateOffset = -Math.abs((labelWidth / 2) * (0, getOffsetFromAngle_1.getOffsetFromAngle)(labelRotate));
            }
            return { origin, rotateOffset };
        })();
        return (<react_1.default.Fragment key={`x-tick-${String(tick)}`}>
        {lineWidth > 0 ? (<react_native_skia_1.Group transform={transformX} clip={ignoreClip ? (0, boundsToClip_1.boundsToClip)(chartBounds) : undefined}>
            <react_native_skia_1.Line p1={p1} p2={p2} color={lineColor} strokeWidth={lineWidth}>
              {linePathEffect ? linePathEffect : null}
            </react_native_skia_1.Line>
          </react_native_skia_1.Group>) : null}
        {font && labelWidth && canFitLabelContent ? (<react_native_skia_1.Group transform={transformX} clip={ignoreClip ? (0, boundsToClip_1.boundsToClip)(chartBounds) : undefined}>
            <react_native_skia_1.Text transform={[
                    {
                        translateX: index === 0 ? 10 : 0,
                        rotate: (Math.PI / 180) * (labelRotate !== null && labelRotate !== void 0 ? labelRotate : 0),
                    },
                ]} origin={origin} color={labelColor} text={contentX} font={font} y={labelY} x={labelX}/>
          </react_native_skia_1.Group>) : null}
      </react_1.default.Fragment>);
    });
    return xAxisNodes;
};
exports.XAxis = XAxis;
exports.XAxisDefaults = {
    lineColor: "hsla(0, 0%, 0%, 0.25)",
    lineWidth: react_native_1.StyleSheet.hairlineWidth,
    tickCount: 5,
    labelOffset: 2,
    axisSide: "bottom",
    yAxisSide: "left",
    labelPosition: "outset",
    formatXLabel: (label) => String(label),
    labelColor: "#000000",
    labelRotate: 0,
};
