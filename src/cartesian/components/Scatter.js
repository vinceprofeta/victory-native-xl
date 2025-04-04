import * as React from "react";
import { Path, Skia, } from "@shopify/react-native-skia";
import { AnimatedPath } from "./AnimatedPath";
export function Scatter({ points, animate, radius = 10, shape = "circle", ...rest }) {
    const path = React.useMemo(() => {
        const p = Skia.Path.Make();
        points.forEach((pt) => {
            const { x, y } = pt;
            if (typeof y !== "number")
                return;
            const r = typeof radius === "function" ? radius(pt) : radius;
            if (shape === "circle")
                p.addCircle(x, y, r);
            else if (shape === "square")
                p.addRect(Skia.XYWHRect(x - r, y - r, r * 2, r * 2));
            else if (shape === "star")
                p.addPath(calculateStarPath(x, y, r, 5));
        });
        return p;
    }, [points, radius, shape]);
    return React.createElement(animate ? AnimatedPath : Path, {
        path,
        ...rest,
        ...(Boolean(animate) && { animate }),
    });
}
const calculateStarPath = (centerX, centerY, radius, points) => {
    const vectors = [];
    for (let i = 0; i <= 2 * points; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const x = centerX + Math.cos(angle) * (i % 2 === 0 ? radius : radius / 2);
        const y = centerY + Math.sin(angle) * (i % 2 === 0 ? radius : radius / 2);
        vectors.unshift([x, y]);
    }
    const path = Skia.Path.Make();
    const firstVec = vectors[0];
    firstVec && path.moveTo(firstVec[0], firstVec[1]);
    for (const vec of vectors.slice(1)) {
        path.lineTo(vec[0], vec[1]);
    }
    path.close();
    return path;
};
