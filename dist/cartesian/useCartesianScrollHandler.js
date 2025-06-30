"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCartesianScrollHandler = useCartesianScrollHandler;
const react_1 = require("react");
// Initialize scroll values to 0. The effect will set the correct initial/updated position.
// This is.... not great...
function useCartesianScrollHandler({ data, dimensions, viewport, scrollX, xScale, scrollControllerRef, prevTranslateX, maxScrollOffset = 35, }) {
    var _a, _b;
    // Refs to track previous state for scroll adjustment logic
    const initialContentLength = (0, react_1.useRef)(data.length);
    const initialLastDataValue = (0, react_1.useRef)((_a = data[data.length - 1]) === null || _a === void 0 ? void 0 : _a.ts);
    const prevTotalContentWidthRef = (0, react_1.useRef)(null);
    const isInitialLoadRef = (0, react_1.useRef)(true);
    const prevViewportXRef = (0, react_1.useRef)((viewport === null || viewport === void 0 ? void 0 : viewport.x) || null);
    const lastValueTs = (_b = data[data.length - 1]) === null || _b === void 0 ? void 0 : _b.ts;
    (0, react_1.useEffect)(() => {
        var _a, _b, _c, _d;
        const currentTotalContentWidth = dimensions.totalContentWidth;
        const viewportWidth = dimensions.width;
        const previousTotalContentWidth = prevTotalContentWidthRef.current;
        const currentDataLength = data.length;
        const previousDataLength = initialContentLength.current;
        if (viewportWidth <= 0 || currentTotalContentWidth < 0) {
            prevViewportXRef.current = (viewport === null || viewport === void 0 ? void 0 : viewport.x) || null;
            return;
        }
        if (data.length === 0) {
            scrollX.value = 0;
            prevTranslateX.value = 0;
            return;
        }
        const maxScroll = Math.max(0, currentTotalContentWidth - viewportWidth + maxScrollOffset);
        let newScrollX;
        const dataLengthChanged = currentDataLength !== previousDataLength;
        const dataPrepended = dataLengthChanged && currentDataLength > previousDataLength;
        const viewportXChanged = (viewport === null || viewport === void 0 ? void 0 : viewport.x) &&
            (((_a = prevViewportXRef === null || prevViewportXRef === void 0 ? void 0 : prevViewportXRef.current) === null || _a === void 0 ? void 0 : _a[0]) !== ((_b = viewport === null || viewport === void 0 ? void 0 : viewport.x) === null || _b === void 0 ? void 0 : _b[0]) ||
                ((_c = prevViewportXRef === null || prevViewportXRef === void 0 ? void 0 : prevViewportXRef.current) === null || _c === void 0 ? void 0 : _c[1]) !== ((_d = viewport === null || viewport === void 0 ? void 0 : viewport.x) === null || _d === void 0 ? void 0 : _d[1]));
        // timne frame changed - completelt new data - reset state
        if (initialLastDataValue.current &&
            initialLastDataValue.current !== lastValueTs &&
            lastValueTs) {
            // if the last value was changed. we did not prepend data we totally reset the data. Scroll to end.
            // reset states
            console.log("Scroll Effect: Date Range Changed");
            scrollX.value = maxScroll;
            isInitialLoadRef.current = true;
            // reset state
            prevTotalContentWidthRef.current = currentTotalContentWidth;
            initialContentLength.current = currentDataLength;
            initialLastDataValue.current = lastValueTs;
            prevViewportXRef.current =
                (viewport === null || viewport === void 0 ? void 0 : viewport.x) || null;
            setTimeout(() => {
                isInitialLoadRef.current = false;
            }, 100);
            return;
        }
        if (isInitialLoadRef.current) {
            newScrollX = maxScroll;
            console.log(`Scroll Effect: Initial Load. Scrolling to end: ${newScrollX}`);
            isInitialLoadRef.current = false;
        }
        else if (!dataPrepended && viewportXChanged) {
            newScrollX = maxScroll;
            console.log(`Scroll Effect: Viewport X Changed. Scrolling to end: ${newScrollX}`);
        }
        else if (previousTotalContentWidth !== null) {
            if (dataPrepended) {
                const deltaWidth = currentTotalContentWidth - previousTotalContentWidth;
                newScrollX = scrollX.value + deltaWidth;
                console.log("Scroll Effect: Data Prepended");
            }
            else {
                newScrollX = scrollX.value;
                console.log(`Scroll Effect: No Prepend / Only Dim Change. Keeping scroll=${scrollX.value.toFixed(2)}`);
            }
        }
        else {
            console.warn("Scroll Effect: Unexpected state - previousTotalContentWidth is null after initial load. Defaulting to maxScroll.");
            newScrollX = maxScroll;
        }
        const clampedScrollX = Math.max(0, Math.min(maxScroll, newScrollX));
        console.log(`Scroll Effect: Clamping. MaxScroll=${maxScroll.toFixed(2)}, CalcScroll=${newScrollX.toFixed(2)}, ClampedScroll=${clampedScrollX.toFixed(2)}`);
        if (scrollX.value !== clampedScrollX) {
            scrollX.value = clampedScrollX;
        }
        if (prevTranslateX.value !== clampedScrollX) {
            prevTranslateX.value = clampedScrollX;
        }
        prevTotalContentWidthRef.current = currentTotalContentWidth;
        initialContentLength.current = currentDataLength;
        initialLastDataValue.current = lastValueTs;
        prevViewportXRef.current = (viewport === null || viewport === void 0 ? void 0 : viewport.x) || null;
    }, [
        dimensions.totalContentWidth,
        dimensions.width,
        data.length,
        scrollX,
        prevTranslateX,
        viewport === null || viewport === void 0 ? void 0 : viewport.x,
    ]);
    // Allows us to control the scroll from the parent component
    (0, react_1.useImperativeHandle)(scrollControllerRef, () => ({
        scrollTo: (domainX) => {
            const offset = 10;
            const pixelX = xScale(domainX) - dimensions.width + offset;
            const maxScroll = Math.max(0, dimensions.totalContentWidth - dimensions.width + 45);
            const clampedX = Math.max(0, Math.min(pixelX, maxScroll));
            scrollX.value = clampedX;
            prevTranslateX.value = clampedX;
        },
        getScrollX() {
            return scrollX.value;
        },
    }), [xScale, dimensions, scrollX, prevTranslateX]);
}
