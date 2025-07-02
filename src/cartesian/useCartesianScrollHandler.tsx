import { useRef, useEffect, useImperativeHandle } from "react";
import type { SharedValue } from "react-native-reanimated";

export function useCartesianScrollHandler({
  data,
  dimensions,
  viewport,
  scrollX,
  xScale,
  scrollControllerRef,
  prevTranslateX,
  maxScrollOffset = 35,
  isScrolling,
}: {
  data: any[];
  dimensions: any;
  viewport: any;
  scrollX: any;
  xScale: any;
  scrollControllerRef: any;
  prevTranslateX: any;
  maxScrollOffset?: number;
  isScrolling: SharedValue<boolean>;
}) {
  // Refs to track previous state for scroll-to-end logic
  const prevViewportXRef = useRef<[number, number] | null>(viewport?.x || null);
  const totalContentWidth = dimensions.totalContentWidth;

  useEffect(() => {
    // Since scroll view is reversed, "end" is at maxScrollOffset (not maxScroll)
    if (totalContentWidth > 0) {
      /// the library content grows which is very annoying. continue to scroll to the end until the content is not growing anymore.
    }
    const scrollToEndPosition = maxScrollOffset ? -maxScrollOffset : 0;
    let shouldScrollToEnd = false;

    if (prevViewportXRef.current !== viewport?.x) {
      shouldScrollToEnd = false;
    } else {
      shouldScrollToEnd = true;
    }

    if (shouldScrollToEnd) {
      scrollX.value = scrollToEndPosition;
      prevTranslateX.value = scrollToEndPosition;
    }

    // Update tracking refs
    prevViewportXRef.current = viewport?.x || null;
  }, [
    maxScrollOffset,
    viewport?.x,
    prevTranslateX,
    scrollX,
    totalContentWidth,
  ]);

  // Allows us to control the scroll from the parent component
  useImperativeHandle(
    scrollControllerRef,
    () => ({
      scrollTo: (ts: number, offset = -20) => {
        const maxScrollValue = maxScrollOffset
          ? -maxScrollOffset + offset
          : offset;
        const pixelX = xScale(ts);
        const totalWidth = dimensions.totalContentWidth;
        const viewportWidth = dimensions.width;

        // Calculate scroll position so that the ts aligns with right edge
        const rawScroll = totalWidth - pixelX + offset;

        // Clamp to [0, maxScroll] range for reversed scroll
        const maxScroll = Math.max(maxScrollValue, totalWidth - viewportWidth);
        const clampedX = Math.max(
          maxScrollValue,
          Math.min(rawScroll, maxScroll),
        );

        scrollX.value = clampedX;
        prevTranslateX.value = clampedX;
      },
      scrollToEnd: () => {
        const endScroll = maxScrollOffset ? -maxScrollOffset : 0;
        scrollX.value = endScroll;
        prevTranslateX.value = endScroll;
      },
      getScrollX() {
        return scrollX.value;
      },
    }),
    [xScale, dimensions, scrollX, prevTranslateX, maxScrollOffset],
  );
}
