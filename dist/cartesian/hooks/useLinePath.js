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
exports.useLinePath = void 0;
const React = __importStar(require("react"));
const d3_shape_1 = require("d3-shape");
const react_native_skia_1 = require("@shopify/react-native-skia");
const stitchDataArray_1 = require("../../utils/stitchDataArray");
const curves_1 = require("../utils/curves");
const groupPointsArray_1 = require("../../utils/groupPointsArray");
const cleanPointsArray_1 = require("../../utils/cleanPointsArray");
const useLinePath = (points, { curveType = "linear", connectMissingData = false } = {}) => {
    const path = React.useMemo(() => {
        const groups = connectMissingData
            ? [(0, cleanPointsArray_1.cleanPointsArray)(points)]
            : (0, groupPointsArray_1.groupPointsArray)(points);
        const p = react_native_skia_1.Skia.Path.Make();
        groups.forEach((group) => {
            var _a;
            const svgPath = (0, d3_shape_1.line)().curve(curves_1.CURVES[curveType])((0, stitchDataArray_1.stitchDataArray)(group));
            if (!svgPath)
                return;
            p.addPath((_a = react_native_skia_1.Skia.Path.MakeFromSVGString(svgPath)) !== null && _a !== void 0 ? _a : react_native_skia_1.Skia.Path.Make());
        });
        return p;
    }, [connectMissingData, points, curveType]);
    return { path };
};
exports.useLinePath = useLinePath;
