import { useRef, useEffect, useImperativeHandle } from "react";

// Initialize scroll values to 0. The effect will set the correct initial/updated position.
// This is.... not great...

export function useCartesianScrollHandler({
  data,
  dimensions,
  viewport,
  scrollX,
  xScale,
  scrollControllerRef,
  prevTranslateX,
}: {
  data: any[];
  dimensions: any;
  viewport: any;
  scrollX: any;
  xScale: any;
  scrollControllerRef: any;
  prevTranslateX: any;
}) {
  // Refs to track previous state for scroll adjustment logic
  const initialContentLength = useRef(data.length);
  const initialLastDataValue = useRef(data[data.length - 1]?.ts);
  const prevTotalContentWidthRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef(true);
  const prevViewportXRef = useRef<[number, number] | null>(viewport?.x || null);
  const lastValueTs = data[data.length - 1]?.ts;

  useEffect(() => {
    const currentTotalContentWidth = dimensions.totalContentWidth;
    const viewportWidth = dimensions.width;
    const previousTotalContentWidth = prevTotalContentWidthRef.current;
    const currentDataLength = data.length;
    const previousDataLength = initialContentLength.current;

    if (viewportWidth <= 0 || currentTotalContentWidth < 0) {
      prevViewportXRef.current = viewport?.x || null;
      return;
    }

    if (data.length === 0) {
      scrollX.value = 0;
      prevTranslateX.value = 0;
      return;
    }

    const maxScroll = Math.max(
      0,
      currentTotalContentWidth - viewportWidth + 20,
    );
    let newScrollX: number;
    const dataLengthChanged = currentDataLength !== previousDataLength;
    const dataPrepended =
      dataLengthChanged && currentDataLength > previousDataLength;
    const viewportXChanged =
      viewport?.x &&
      (prevViewportXRef?.current?.[0] !== viewport?.x?.[0] ||
        prevViewportXRef?.current?.[1] !== viewport?.x?.[1]);

    if (
      initialLastDataValue.current &&
      initialLastDataValue.current !== lastValueTs &&
      lastValueTs
    ) {
      // if the last value was changed. we did not prepend data we totally reset the data. Scroll to end.
      // reset states
      console.log("Scroll Effect: Date Range Changed");
      initialLastDataValue.current = lastValueTs;
      scrollX.value = maxScroll;
      isInitialLoadRef.current = true;
      return;
    }

    if (isInitialLoadRef.current) {
      newScrollX = maxScroll;
      console.log(
        `Scroll Effect: Initial Load. Scrolling to end: ${newScrollX}`,
      );
      isInitialLoadRef.current = false;
    } else if (!dataPrepended && viewportXChanged) {
      newScrollX = maxScroll;
      console.log(
        `Scroll Effect: Viewport X Changed. Scrolling to end: ${newScrollX}`,
      );
    } else if (previousTotalContentWidth !== null) {
      if (dataPrepended) {
        const deltaWidth = currentTotalContentWidth - previousTotalContentWidth;
        newScrollX = scrollX.value + deltaWidth;
        console.log("Scroll Effect: Data Prepended");
      } else {
        newScrollX = scrollX.value;
        console.log(
          `Scroll Effect: No Prepend / Only Dim Change. Keeping scroll=${scrollX.value.toFixed(
            2,
          )}`,
        );
      }
    } else {
      console.warn(
        "Scroll Effect: Unexpected state - previousTotalContentWidth is null after initial load. Defaulting to maxScroll.",
      );
      newScrollX = maxScroll;
    }

    const clampedScrollX = Math.max(0, Math.min(maxScroll, newScrollX));
    console.log(
      `Scroll Effect: Clamping. MaxScroll=${maxScroll.toFixed(
        2,
      )}, CalcScroll=${newScrollX.toFixed(
        2,
      )}, ClampedScroll=${clampedScrollX.toFixed(2)}`,
    );

    if (scrollX.value !== clampedScrollX) {
      scrollX.value = clampedScrollX;
    }
    if (prevTranslateX.value !== clampedScrollX) {
      prevTranslateX.value = clampedScrollX;
    }

    prevTotalContentWidthRef.current = currentTotalContentWidth;
    initialContentLength.current = currentDataLength;
    initialLastDataValue.current = lastValueTs;
    prevViewportXRef.current = viewport?.x || (null as [number, number] | null);
  }, [
    dimensions.totalContentWidth,
    dimensions.width,
    data.length,
    scrollX,
    prevTranslateX,
    viewport?.x,
  ]);

  // Allows us to control the scroll from the parent component
  useImperativeHandle(
    scrollControllerRef,
    () => ({
      scrollTo: (domainX: number) => {
        const offset = 40;
        const pixelX = xScale(domainX) - dimensions.width + offset;
        const maxScroll = Math.max(
          0,
          dimensions.totalContentWidth - dimensions.width,
        );
        const clampedX = Math.max(0, Math.min(pixelX, maxScroll));
        scrollX.value = clampedX;
        prevTranslateX.value = clampedX;
      },
      getScrollX() {
        return scrollX.value;
      },
    }),
    [xScale, dimensions, scrollX, prevTranslateX],
  );
}
