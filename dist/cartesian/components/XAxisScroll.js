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
exports.XAxisDefaults = exports.XAxis = exports.MemoizedXAxis = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_skia_1 = require("@shopify/react-native-skia");
const boundsToClip_1 = require("../../utils/boundsToClip");
const tickHelpers_1 = require("../../utils/tickHelpers");
const react_native_reanimated_1 = require("react-native-reanimated");
const react_fast_compare_1 = __importDefault(require("react-fast-compare"));
// Simple debounce utility
function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}
const MemoizedXAxis = ({ xScale: xScaleProp, ignoreClip, yScale, axisSide = "bottom", yAxisSide = "left", labelPosition = "outset", labelRotate, tickCount = tickHelpers_1.DEFAULT_TICK_COUNT, tickValues, labelOffset = 2, labelColor = "#000000", lineWidth = react_native_1.StyleSheet.hairlineWidth, lineColor = "hsla(0, 0%, 0%, 0.25)", font, formatXLabel = (label) => String(label), ix = [], isNumericalData, linePathEffect, chartBounds, enableRescaling, zoom, scrollX, onVisibleTicksChange, secondaryXFont, labelXCenter = false, }) => {
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
    const { ticksInRangeWithBuffer } = useProcessAndReportTicks({
        scrollX,
        chartBounds,
        xTicksNormalized,
        onVisibleTicksChange,
        uniqueValueIndices,
        isNumericalData,
        ix,
        xScale,
    });
    return xTicksNormalized.map((tick, index, arr) => {
        return (<MemoTickGroup visible={true} key={`x-tick-${String(tick)}`} lineWidth={lineWidth} ignoreClip={true} chartBounds={chartBounds} transformX={transformX} uniqueValueIndices={uniqueValueIndices} tick={tick} xScale={xScale} yScale={yScale} font={font} labelRotate={labelRotate} labelColor={labelColor} secondaryXFont={secondaryXFont} formatXLabel={formatXLabel} isNumericalData={isNumericalData} ix={ix} labelXCenter={labelXCenter} index={index} arr={arr} xTicksNormalized={xTicksNormalized} y2={y2} y1={y1} lineColor={lineColor} axisSide={axisSide} labelPosition={labelPosition} labelOffset={labelOffset} fontSize={fontSize}/>);
    });
};
exports.MemoizedXAxis = MemoizedXAxis;
const MemoTickGroup = react_1.default.memo(TickGroup, (prev, next) => {
    return (prev.tick === next.tick &&
        prev.xScale === next.xScale &&
        prev.yScale === next.yScale &&
        prev.index === next.index &&
        prev.visible === next.visible);
});
function TickGroup({ lineWidth, ignoreClip, chartBounds, transformX, uniqueValueIndices, tick, xScale, yScale, font, labelColor, secondaryXFont, formatXLabel, isNumericalData, ix, labelXCenter, index, arr, xTicksNormalized, y2, y1, lineColor, axisSide, labelPosition, labelOffset, fontSize, visible, }) {
    var _a, _b, _c;
    const indexPosition = (_a = uniqueValueIndices.get(String(tick))) !== null && _a !== void 0 ? _a : tick;
    const tickPosition = tick;
    const p1 = (0, react_native_skia_1.vec)(xScale(tickPosition), yScale(y2));
    const p2 = (0, react_native_skia_1.vec)(xScale(tickPosition), yScale(y1));
    const val = isNumericalData ? tick : ix[indexPosition];
    const contentXValue = formatXLabel(val);
    const contentX = typeof contentXValue === "string" ? contentXValue : contentXValue.top;
    const contentXBottom = typeof contentXValue === "string" ? null : contentXValue.bottom;
    const labelWidth = (_c = (_b = font === null || font === void 0 ? void 0 : font.getGlyphWidths) === null || _b === void 0 ? void 0 : _b.call(font, font.getGlyphIDs(contentX)).reduce((sum, value) => sum + value, 0)) !== null && _c !== void 0 ? _c : 0;
    const labelWidthBottom = contentXBottom && secondaryXFont
        ? secondaryXFont
            .getGlyphWidths(secondaryXFont.getGlyphIDs(contentXBottom))
            .reduce((sum, value) => sum + value, 0)
        : 0;
    const canFitLabelContent = true;
    let labelX = 0;
    let labelXBottom = 0;
    let centerX = 0;
    if (labelXCenter) {
        if (index < arr.length - 1) {
            const nextTick = arr[index + 1];
            centerX = xScale(tick) + (xScale(nextTick) - xScale(tick)) / 2;
        }
        else if (index > 0) {
            const prevTick = arr[index - 1];
            const spacing = xScale(tick) - xScale(prevTick);
            centerX = xScale(tick) + spacing / 2;
        }
        else {
            centerX = xScale(tick);
        }
        labelX = centerX - labelWidth / 2;
        labelXBottom = centerX - labelWidthBottom / 2;
    }
    else {
        labelX = xScale(tick) - (labelWidth !== null && labelWidth !== void 0 ? labelWidth : 0) / 2;
        labelXBottom = xScale(tick) - (labelWidthBottom !== null && labelWidthBottom !== void 0 ? labelWidthBottom : 0) / 2;
    }
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
    const origin = undefined;
    const actualClipPath = (0, react_1.useMemo)(() => {
        return ignoreClip ? undefined : (0, boundsToClip_1.boundsToClip)(chartBounds);
    }, [ignoreClip, chartBounds]);
    if (!visible)
        return null;
    const translateX = index === 0 ? 10 : index === xTicksNormalized.length - 1 ? -4 : 0;
    return (<react_native_skia_1.Group key={`x-tick-${String(tick)}`} clip={actualClipPath}>
      {lineWidth > 0 ? (<react_native_skia_1.Group transform={transformX}>
          <react_native_skia_1.Line p1={p1} p2={p2} color={lineColor} strokeWidth={lineWidth}/>
        </react_native_skia_1.Group>) : null}
      {font && labelWidth && canFitLabelContent ? (<react_native_skia_1.Group transform={transformX}>
          <react_native_skia_1.Text transform={[{ translateX }]} origin={origin} color={labelColor} text={contentX} font={font} y={labelY} x={labelX}/>
          {contentXBottom ? (<react_native_skia_1.Text transform={[{ translateX }]} origin={origin} color={labelColor} text={contentXBottom} font={secondaryXFont || font} y={labelY + 15} x={labelXBottom}/>) : null}
        </react_native_skia_1.Group>) : null}
    </react_native_skia_1.Group>);
}
function useProcessAndReportTicks({ scrollX, chartBounds, xTicksNormalized, onVisibleTicksChange, uniqueValueIndices, isNumericalData, ix, xScale, }) {
    const [visisbleTicks, setVisisbleTicks] = (0, react_1.useState)({
        ticksInRange: [],
        ticksInRangeWithBuffer: [],
    });
    const scaleDomain = (0, react_1.useMemo)(() => xScale.domain(), [xScale]);
    const scaleRange = (0, react_1.useMemo)(() => xScale.range(), [xScale]);
    const lastReportedVisibleTicksRef = (0, react_1.useRef)(null);
    const processAndReportTicks = (0, react_1.useMemo)(() => {
        return () => {
            if (!onVisibleTicksChange)
                return;
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
    // Debounce the JS processing function
    const debouncedProcessAndReportTicks = (0, react_1.useMemo)(() => {
        return debounce(processAndReportTicks, 50); // Adjust debounce time (ms) as needed
    }, [processAndReportTicks]);
    // NEW: Debounced function for updating the internal virtualization state
    const debouncedSetVisibleTicks = (0, react_1.useMemo)(() => {
        return debounce((data) => {
            setVisisbleTicks(data);
        }, 90); // Using a 90ms debounce, adjust as needed
    }, []);
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
        const chartBoundsRight = chartBounds.right + 10;
        const chartBoundsLeft = chartBounds.left - 10;
        const totalWidth = chartBoundsRight - chartBoundsLeft;
        const renderWidth = totalWidth * 4; // Reverted to original totalWidth * 2
        let firstVisibleTick = null;
        let lastVisibleTick = null;
        const ticksInRange = [];
        const ticksInRangeWithBuffer = [];
        for (const tick of xTicksNormalized) {
            const numericTick = Number(tick);
            if (Number.isNaN(numericTick))
                continue;
            const tickPixelX = scaleWorklet(numericTick);
            const scrolledPixelX = tickPixelX - scrollX.value;
            // Optimization 1: Current tick is past the right buffered edge.
            // If so, all subsequent ticks (in a sorted array) are also past, so we can stop.
            if (scrolledPixelX > chartBoundsRight + renderWidth) {
                break;
            }
            // Optimization 2: Current tick is before the left buffered edge.
            // If so, this tick is not in the buffer or visible area. Skip to the next tick.
            // Subsequent ticks might be in view, so we use 'continue' instead of 'break'.
            if (scrolledPixelX < chartBoundsLeft - renderWidth) {
                continue;
            }
            // If we reach here, the tick is within the renderable buffer zone:
            // [chartBoundsLeft - renderWidth, chartBoundsRight + renderWidth]
            // So, it should always be added to ticksInRangeWithBuffer.
            ticksInRangeWithBuffer.push(tick);
            // Now, check if it's also within the strictly visible chartBounds for the callback.
            if (scrolledPixelX >= chartBoundsLeft &&
                scrolledPixelX <= chartBoundsRight) {
                ticksInRange.push(tick);
                if (firstVisibleTick === null) {
                    firstVisibleTick = tick; // Found the first strictly visible tick
                }
                lastVisibleTick = tick; // Keep updating last strictly visible tick
            }
        }
        // Return the heuristic value
        return {
            first: firstVisibleTick,
            last: lastVisibleTick,
            ticksInRange,
            ticksInRangeWithBuffer,
        };
    }, (current, previous) => {
        // React: Trigger JS processing only if heuristic changes
        "worklet";
        // Condition for onVisibleTicksChange (debouncedProcessAndReportTicks)
        if (previous === null ||
            current.first !== previous.first ||
            current.last !== previous.last) {
            (0, react_native_reanimated_1.runOnJS)(debouncedProcessAndReportTicks)(); // Call the debounced function
        }
        // Condition for setVisisbleTicks (virtualization state)
        // let shouldUpdateVirtualizationState = false
        // if (previous === null) {
        //   shouldUpdateVirtualizationState = true
        // } else {
        //   if (!_arraysEqual(current.ticksInRangeWithBuffer, previous.ticksInRangeWithBuffer)) {
        //     shouldUpdateVirtualizationState = true
        //   }
        // }
        // if (shouldUpdateVirtualizationState) {
        //   runOnJS(debouncedSetVisibleTicks)({
        //     ticksInRange: current.ticksInRange,
        //     ticksInRangeWithBuffer: current.ticksInRangeWithBuffer,
        //   })
        // }
    }, 
    // Dependencies for the reaction prepare block
    [
        scrollX,
        scaleDomain,
        scaleRange,
        chartBounds,
        xTicksNormalized,
        debouncedProcessAndReportTicks,
        debouncedSetVisibleTicks,
    ]);
    return {
        ticksInRange: visisbleTicks.ticksInRange,
        ticksInRangeWithBuffer: visisbleTicks.ticksInRangeWithBuffer,
    };
}
exports.XAxis = (0, react_1.memo)(exports.MemoizedXAxis);
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
// Helper function to check if two arrays are equal
const _arraysEqual = (a, b) => {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
};
