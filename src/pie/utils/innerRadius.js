// Inner radius can be supplied as a number (px) or a percentage string
export const handleTranslateInnerRadius = (innerRadius, radius) => {
    if (typeof innerRadius === "string") {
        try {
            innerRadius = parseFloat(innerRadius.replace("%", ""));
            innerRadius = (innerRadius / 100) * radius;
        }
        catch (error) {
            console.warn(`Error parsing innerRadius as a number: ${innerRadius}`);
            innerRadius = 0;
        }
    }
    // prevent inversion, don't let the inner radius be greater than the actual radius
    return innerRadius >= radius ? 0 : innerRadius;
};
