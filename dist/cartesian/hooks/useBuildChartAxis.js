"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBuildChartAxis = void 0;
const react_1 = __importDefault(require("react"));
const CartesianAxis_1 = require("../components/CartesianAxis");
const XAxis_1 = require("../components/XAxis");
const YAxis_1 = require("../components/YAxis");
const Frame_1 = require("../components/Frame");
/**
 * This hook builds the chart axes + the surrounding frame based on either the new x, y, frame props, or via backwards compatibility for the older axisOptions props and the associated default values it had. The defaults for the former are the new XAxisDefaults, YAxisDefaults, and FrameDefaults, while the defaults for the latter come from the older CartesianAxisDefaultProps.
 *
 * The hook returns a normalized object of `xAxis, yAxes, and frame` objects that are used to determine the axes to render and in the transformInputData function.
 */
const useBuildChartAxis = ({ axisOptions, xAxis, yAxis, frame, yKeys, }) => {
    const normalizeAxisProps = react_1.default.useMemo(() => {
        var _a, _b, _c, _d;
        // Helper functions to pick only the relevant properties for each prop type
        const pickXAxisProps = (axisProp) => ({
            axisSide: axisProp.axisSide.x,
            yAxisSide: axisProp.axisSide.y,
            tickCount: typeof axisProp.tickCount === "number"
                ? axisProp.tickCount
                : axisProp.tickCount.x,
            tickValues: axisProp.tickValues &&
                typeof axisProp.tickValues === "object" &&
                "x" in axisProp.tickValues
                ? axisProp.tickValues.x
                : axisProp.tickValues,
            formatXLabel: axisProp.formatXLabel,
            labelPosition: typeof axisProp.labelPosition === "string"
                ? axisProp.labelPosition
                : axisProp.labelPosition.x,
            labelOffset: typeof axisProp.labelOffset === "number"
                ? axisProp.labelOffset
                : axisProp.labelOffset.x,
            labelColor: typeof axisProp.labelColor === "string"
                ? axisProp.labelColor
                : axisProp.labelColor.x,
            lineWidth: typeof axisProp.lineWidth === "object" && "grid" in axisProp.lineWidth
                ? typeof axisProp.lineWidth.grid === "object" &&
                    "x" in axisProp.lineWidth.grid
                    ? axisProp.lineWidth.grid.x
                    : axisProp.lineWidth.grid
                : axisProp.lineWidth,
            lineColor: (typeof axisProp.lineColor === "object" &&
                "grid" in axisProp.lineColor
                ? typeof axisProp.lineColor.grid === "object" &&
                    "x" in axisProp.lineColor.grid
                    ? axisProp.lineColor.grid.x
                    : axisProp.lineColor.grid
                : axisProp.lineColor),
            font: axisProp.font,
        });
        const pickYAxisProps = (axisProp) => {
            return {
                axisSide: axisProp.axisSide.y,
                formatYLabel: axisProp.formatYLabel,
                tickValues: axisProp.tickValues &&
                    typeof axisProp.tickValues === "object" &&
                    "y" in axisProp.tickValues
                    ? axisProp.tickValues.y
                    : axisProp.tickValues,
                tickCount: typeof axisProp.tickCount === "number"
                    ? axisProp.tickCount
                    : axisProp.tickCount.y,
                labelPosition: typeof axisProp.labelPosition === "string"
                    ? axisProp.labelPosition
                    : axisProp.labelPosition.y,
                labelOffset: typeof axisProp.labelOffset === "number"
                    ? axisProp.labelOffset
                    : axisProp.labelOffset.y,
                labelColor: typeof axisProp.labelColor === "string"
                    ? axisProp.labelColor
                    : axisProp.labelColor.y,
                lineWidth: typeof axisProp.lineWidth === "object" && "grid" in axisProp.lineWidth
                    ? typeof axisProp.lineWidth.grid === "object" &&
                        "y" in axisProp.lineWidth.grid
                        ? axisProp.lineWidth.grid.y
                        : axisProp.lineWidth.grid
                    : axisProp.lineWidth,
                lineColor: (typeof axisProp.lineColor === "object" &&
                    "grid" in axisProp.lineColor
                    ? typeof axisProp.lineColor.grid === "object" &&
                        "y" in axisProp.lineColor.grid
                        ? axisProp.lineColor.grid.y
                        : axisProp.lineColor.grid
                    : axisProp.lineColor),
                font: axisProp.font,
                yKeys: yKeys,
                domain: axisProp.domain,
            };
        };
        const pickFrameProps = (axisProp) => ({
            lineColor: typeof axisProp.lineColor === "object" && "frame" in axisProp.lineColor
                ? axisProp.lineColor.frame
                : axisProp.lineColor,
            lineWidth: typeof axisProp.lineWidth === "object" && "frame" in axisProp.lineWidth
                ? axisProp.lineWidth.frame
                : axisProp.lineWidth,
        });
        const defaultAxisOptions = Object.assign(Object.assign(Object.assign({}, CartesianAxis_1.CartesianAxisDefaultProps), axisOptions), { labelCenterOffset: (_a = axisOptions === null || axisOptions === void 0 ? void 0 : axisOptions.labelCenterOffset) !== null && _a !== void 0 ? _a : { x: 0, y: 0 }, labelXCenter: (_b = axisOptions === null || axisOptions === void 0 ? void 0 : axisOptions.labelXCenter) !== null && _b !== void 0 ? _b : false, ignoreClip: (_c = axisOptions === null || axisOptions === void 0 ? void 0 : axisOptions.ignoreClip) !== null && _c !== void 0 ? _c : false, secondaryXFont: (_d = axisOptions === null || axisOptions === void 0 ? void 0 : axisOptions.secondaryXFont) !== null && _d !== void 0 ? _d : null });
        const xAxisWithDefaults = Object.assign(Object.assign({}, XAxis_1.XAxisDefaults), xAxis);
        const yAxisWithDefaults = yAxis
            ? yAxis.length === 1
                ? yAxis.map((axis) => {
                    var _a;
                    return (Object.assign(Object.assign(Object.assign({}, YAxis_1.YAxisDefaults), { yKeys: (_a = axis.yKeys) !== null && _a !== void 0 ? _a : yKeys }), axis));
                })
                : yAxis.map((axis) => (Object.assign(Object.assign({}, YAxis_1.YAxisDefaults), axis)))
            : [Object.assign(Object.assign({}, YAxis_1.YAxisDefaults), { yKeys })];
        const frameWithDefaults = frame
            ? Object.assign(Object.assign({}, Frame_1.FrameDefaults), frame) : Frame_1.FrameDefaults;
        return {
            xAxis: xAxis ? xAxisWithDefaults : pickXAxisProps(defaultAxisOptions),
            yAxes: yAxis ? yAxisWithDefaults : [pickYAxisProps(defaultAxisOptions)],
            frame: frameWithDefaults !== null && frameWithDefaults !== void 0 ? frameWithDefaults : pickFrameProps(defaultAxisOptions),
        };
    }, [axisOptions, xAxis, yAxis, frame, yKeys]);
    return normalizeAxisProps;
};
exports.useBuildChartAxis = useBuildChartAxis;
