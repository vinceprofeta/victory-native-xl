export const DEFAULT_TICK_COUNT = 5;
function coerceNumArray(collection) {
    return collection.map((item, idx) => Number.isNaN(Number(item)) ? idx : item);
}
const containsNonNumbers = (arr) => {
    return Array.isArray(arr) && arr.some((t) => Number.isNaN(Number(t)));
};
export const downsampleTicks = (tickValues, tickCount) => {
    if (containsNonNumbers(tickValues)) {
        // Throw Error here until we expand tickValues to accept string and date types, like Victory web
        throw new Error("TickValues array must only contain numbers.");
    }
    if (!tickCount ||
        !Array.isArray(tickValues) ||
        tickValues.length <= tickCount) {
        return tickValues;
    }
    const k = Math.floor(tickValues.length / tickCount);
    return tickValues.filter((_, i) => i % k === 0);
};
const getMinValue = (arr) => {
    return Math.min(...arr);
};
const getMaxValue = (arr) => {
    return Math.max(...arr);
};
export const getDomainFromTicks = (tickValues) => {
    // Check if undefined OR if its not an array of numbers
    if (!tickValues)
        return;
    let numTicksArr;
    if (containsNonNumbers(tickValues)) {
        // Currently, we should ONLY accept numbers in the tickValues array (accepting strings and dates TBD); however, we want to catch any non-numbers and coerce them to numbers for domain purposes.
        numTicksArr = coerceNumArray(tickValues);
    }
    else {
        numTicksArr = tickValues;
    }
    const min = getMinValue(numTicksArr);
    const max = getMaxValue(numTicksArr);
    return [min, max];
};
