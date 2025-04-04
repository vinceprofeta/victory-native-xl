import React, { useMemo } from "react";
import { Line, Path, Skia, Text, vec, } from "@shopify/react-native-skia";
import { StyleSheet } from "react-native";
import { getFontGlyphWidth } from "../../utils/getFontGlyphWidth";
import { DEFAULT_TICK_COUNT } from "../../utils/tickHelpers";
/**
 * @deprecated This component will eventually be replaced by the new, separate x/y/frame components.
 */
export const CartesianAxis = ({ tickCount = DEFAULT_TICK_COUNT, xTicksNormalized, yTicksNormalized, labelPosition = "outset", labelOffset = { x: 2, y: 4 }, axisSide = { x: "bottom", y: "left" }, lineColor = "hsla(0, 0%, 0%, 0.25)", lineWidth = StyleSheet.hairlineWidth, labelColor = "#000000", formatYLabel = (label) => String(label), formatXLabel = (label) => String(label), yScale, xScale, font, isNumericalData = false, ix = [], }) => {
    const axisConfiguration = useMemo(() => {
        return {
            xTicks: typeof tickCount === "number" ? tickCount : tickCount.x,
            yTicks: typeof tickCount === "number" ? tickCount : tickCount.y,
            xLabelOffset: typeof labelOffset === "number" ? labelOffset : labelOffset.x,
            yLabelOffset: typeof labelOffset === "number" ? labelOffset : labelOffset.y,
            xAxisPosition: axisSide.x,
            yAxisPosition: axisSide.y,
            xLabelPosition: typeof labelPosition === "string" ? labelPosition : labelPosition.x,
            yLabelPosition: typeof labelPosition === "string" ? labelPosition : labelPosition.y,
            gridXLineColor: (typeof lineColor === "object" && "grid" in lineColor
                ? typeof lineColor.grid === "object" && "x" in lineColor.grid
                    ? lineColor.grid.x
                    : lineColor.grid
                : lineColor),
            gridYLineColor: (typeof lineColor === "object" && "grid" in lineColor
                ? typeof lineColor.grid === "object" && "y" in lineColor.grid
                    ? lineColor.grid.y
                    : lineColor.grid
                : lineColor),
            gridFrameLineColor: (typeof lineColor === "object" && "frame" in lineColor
                ? lineColor.frame
                : lineColor),
            gridXLineWidth: typeof lineWidth === "object" && "grid" in lineWidth
                ? typeof lineWidth.grid === "object" && "x" in lineWidth.grid
                    ? lineWidth.grid.x
                    : lineWidth.grid
                : lineWidth,
            gridYLineWidth: typeof lineWidth === "object" && "grid" in lineWidth
                ? typeof lineWidth.grid === "object" && "y" in lineWidth.grid
                    ? lineWidth.grid.y
                    : lineWidth.grid
                : lineWidth,
            gridFrameLineWidth: typeof lineWidth === "object" && "frame" in lineWidth
                ? lineWidth.frame
                : lineWidth,
        };
    }, [
        tickCount,
        labelOffset,
        axisSide.x,
        axisSide.y,
        labelPosition,
        lineColor,
        lineWidth,
    ]);
    const { xTicks, yTicks, xAxisPosition, yAxisPosition, xLabelPosition, yLabelPosition, xLabelOffset, yLabelOffset, gridXLineColor, gridYLineColor, gridFrameLineColor, gridXLineWidth, gridYLineWidth, gridFrameLineWidth, } = axisConfiguration;
    const [x1 = 0, x2 = 0] = xScale.domain();
    const [y1 = 0, y2 = 0] = yScale.domain();
    const [x1r = 0, x2r = 0] = xScale.range();
    const fontSize = font?.getSize() ?? 0;
    const yAxisNodes = yTicksNormalized.map((tick) => {
        const contentY = formatYLabel(tick);
        const labelWidth = getFontGlyphWidth(contentY, font);
        const labelY = yScale(tick) + fontSize / 3;
        const labelX = (() => {
            // left, outset
            if (yAxisPosition === "left" && yLabelPosition === "outset") {
                return xScale(x1) - (labelWidth + yLabelOffset);
            }
            // left, inset
            if (yAxisPosition === "left" && yLabelPosition === "inset") {
                return xScale(x1) + yLabelOffset;
            }
            // right, outset
            if (yAxisPosition === "right" && yLabelPosition === "outset") {
                return xScale(x2) + yLabelOffset;
            }
            // right, inset
            return xScale(x2) - (labelWidth + yLabelOffset);
        })();
        const canFitLabelContent = labelY > fontSize && labelY < yScale(y2);
        return (React.createElement(React.Fragment, { key: `y-tick-${tick}` },
            gridYLineWidth > 0 ? (React.createElement(Line, { p1: vec(xScale(x1), yScale(tick)), p2: vec(xScale(x2), yScale(tick)), color: gridYLineColor, strokeWidth: gridYLineWidth })) : null,
            font
                ? canFitLabelContent && (React.createElement(Text, { color: typeof labelColor === "string" ? labelColor : labelColor.y, text: contentY, font: font, y: labelY, x: labelX }))
                : null));
    });
    const xAxisNodes = xTicksNormalized.map((tick) => {
        const val = isNumericalData ? tick : ix[tick];
        const contentX = formatXLabel(val);
        const labelWidth = getFontGlyphWidth(contentX, font);
        const labelX = xScale(tick) - (labelWidth ?? 0) / 2;
        const canFitLabelContent = yAxisPosition === "left" ? labelX + labelWidth < x2r : x1r < labelX;
        const labelY = (() => {
            // bottom, outset
            if (xAxisPosition === "bottom" && xLabelPosition === "outset") {
                return yScale(y2) + xLabelOffset + fontSize;
            }
            // bottom, inset
            if (xAxisPosition === "bottom" && xLabelPosition === "inset") {
                return yScale(y2) - xLabelOffset;
            }
            // top, outset
            if (xAxisPosition === "top" && xLabelPosition === "outset") {
                return yScale(y1) - xLabelOffset;
            }
            // top, inset
            return yScale(y1) + fontSize + xLabelOffset;
        })();
        return (React.createElement(React.Fragment, { key: `x-tick-${tick}` },
            gridXLineWidth > 0 ? (React.createElement(Line, { p1: vec(xScale(tick), yScale(y2)), p2: vec(xScale(tick), yScale(y1)), color: gridXLineColor, strokeWidth: gridXLineWidth })) : null,
            font && labelWidth && canFitLabelContent ? (React.createElement(Text, { color: typeof labelColor === "string" ? labelColor : labelColor.x, text: contentX, font: font, y: labelY, x: labelX })) : null));
    });
    const boundingFrame = React.useMemo(() => {
        const framePath = Skia.Path.Make();
        framePath.addRect(Skia.XYWHRect(xScale(x1), yScale(y1), xScale(x2) - xScale(x1), yScale(y2) - yScale(y1)));
        return framePath;
    }, [x1, x2, xScale, y1, y2, yScale]);
    return (React.createElement(React.Fragment, null,
        xTicks > 0 ? xAxisNodes : null,
        yTicks > 0 ? yAxisNodes : null,
        React.createElement(Path, { path: boundingFrame, strokeWidth: gridFrameLineWidth, style: "stroke", color: gridFrameLineColor })));
};
export const CartesianAxisDefaultProps = {
    lineColor: "hsla(0, 0%, 0%, 0.25)",
    lineWidth: StyleSheet.hairlineWidth,
    tickCount: 5,
    labelOffset: { x: 2, y: 4 },
    axisSide: { x: "bottom", y: "left" },
    labelPosition: "outset",
    formatXLabel: (label) => String(label),
    formatYLabel: (label) => String(label),
    labelColor: "#000000",
    ix: [],
    domain: null,
};
