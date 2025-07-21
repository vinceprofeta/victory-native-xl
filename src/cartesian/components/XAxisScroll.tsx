import React, { memo, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import {
  type Color,
  Group,
  Line,
  Text,
  vec,
  type SkFont as Font,
  type SkPoint,
} from "@shopify/react-native-skia";

import { boundsToClip } from "../../utils/boundsToClip";
import { DEFAULT_TICK_COUNT, downsampleTicks } from "../../utils/tickHelpers";
import type {
  ChartBounds,
  InputDatum,
  InputFields,
  Scale,
  ValueOf,
  XAxisProps,
  XAxisPropsWithDefaults,
} from "../../types";
import {
  runOnJS,
  type SharedValue,
  useDerivedValue,
  useAnimatedReaction,
} from "react-native-reanimated";

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: Parameters<T>) {
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

export const MemoizedXAxis = <
  RawData extends Record<string, unknown>,
  XK extends keyof InputFields<RawData>,
>({
  xScale: xScaleProp,
  ignoreClip,
  yScale,
  axisSide = "bottom",
  yAxisSide = "left",
  labelPosition = "outset",
  labelRotate,
  tickCount = DEFAULT_TICK_COUNT,
  tickValues,
  labelOffset = 2,
  labelColor = "#000000",
  lineWidth = StyleSheet.hairlineWidth,
  lineColor = "hsla(0, 0%, 0%, 0.25)",
  font,
  formatXLabel = (label: ValueOf<InputDatum>) => String(label),
  ix = [],
  isNumericalData,
  linePathEffect,
  chartBounds,
  enableRescaling,
  zoom,
  scrollX,
  onVisibleTicksChange,
  secondaryXFont,
  labelXCenter = false,
  scrollXDerived,
  isScrolling,
}: XAxisProps<RawData, XK> & {
  scrollX: SharedValue<number>;
  ignoreClip: boolean;
  onVisibleTicksChange?: (visibleTickData: Array<ValueOf<RawData[XK]>>) => void;
  scrollXDerived: SharedValue<number>;
  isScrolling: SharedValue<boolean>;
}) => {
  const transformX = useDerivedValue(() => {
    "worklet";
    return [{ translateX: scrollXDerived.value }];
  }, [scrollXDerived]);

  // Create a mapping of unique values to their first occurrence index
  const uniqueValueIndices = useMemo(() => {
    return ix.reduce((acc, val, index) => {
      if (!acc.has(String(val))) {
        acc.set(String(val), index);
      }
      return acc;
    }, new Map<string, number>());
  }, [ix]);

  const xScale = useMemo(
    () => (zoom ? zoom.rescaleX(xScaleProp) : xScaleProp),
    [zoom, xScaleProp],
  );
  const [y1 = 0, y2 = 0] = yScale.domain();
  const fontSize = font?.getSize() ?? 0;

  // Use tickValues if provided, otherwise generate ticks
  const xTicksNormalized = useMemo(
    () =>
      tickValues
        ? downsampleTicks(tickValues, tickCount)
        : enableRescaling
        ? xScale.ticks(tickCount)
        : xScaleProp.ticks(tickCount),
    [tickValues, tickCount, enableRescaling, xScale, xScaleProp],
  );

  // Ref to store the last reported visible ticks on the JS thread
  useProcessAndReportTicks({
    scrollX,
    scrollXDerived,
    chartBounds,
    xTicksNormalized,
    onVisibleTicksChange,
    uniqueValueIndices,
    isNumericalData,
    ix,
    xScale,
    isScrolling,
    labelXCenter,
  });

  return xTicksNormalized.map((tick, index, arr) => {
    return (
      <MemoTickGroup
        visible={true}
        key={`x-tick-${String(tick)}`}
        lineWidth={lineWidth}
        ignoreClip={true}
        chartBounds={chartBounds}
        transformX={transformX}
        uniqueValueIndices={uniqueValueIndices}
        tick={tick}
        xScale={xScale}
        yScale={yScale}
        font={font}
        labelRotate={labelRotate}
        labelColor={labelColor}
        secondaryXFont={secondaryXFont}
        formatXLabel={formatXLabel}
        isNumericalData={isNumericalData}
        ix={ix}
        labelXCenter={labelXCenter}
        index={index}
        arr={arr}
        xTicksNormalized={xTicksNormalized}
        y2={y2}
        y1={y1}
        lineColor={lineColor}
        axisSide={axisSide}
        labelPosition={labelPosition}
        labelOffset={labelOffset}
        fontSize={fontSize}
      />
    );
  });
};

const MemoTickGroup = React.memo(TickGroup, (prev, next) => {
  return (
    prev.tick === next.tick &&
    prev.xScale === next.xScale &&
    prev.yScale === next.yScale &&
    prev.index === next.index &&
    prev.visible === next.visible
  );
});

function TickGroup({
  lineWidth,
  ignoreClip,
  chartBounds,
  transformX,
  uniqueValueIndices,
  tick,
  xScale,
  yScale,
  font,
  labelColor,
  secondaryXFont,
  formatXLabel,
  isNumericalData,
  ix,
  labelXCenter,
  index,
  arr,
  xTicksNormalized,
  y2,
  y1,
  lineColor,
  axisSide,
  labelPosition,
  labelOffset,
  fontSize,
  visible,
}: {
  lineWidth: number;
  ignoreClip: boolean;
  chartBounds: ChartBounds;
  transformX: SharedValue<{ translateX: number }[]>;
  uniqueValueIndices: Map<string, number>;
  tick: number;
  xScale: Scale;
  yScale: Scale;
  font?: Font | null;
  labelRotate?: number;
  labelColor: string;
  secondaryXFont?: Font | null;
  formatXLabel: (label: any) => string | { top: string; bottom: string };
  isNumericalData: boolean;
  ix: any[];
  labelXCenter: boolean;
  index: number;
  arr: number[];
  xTicksNormalized: number[];
  y2: number;
  y1: number;
  lineColor: Color;
  axisSide: "top" | "bottom";
  labelPosition: "inset" | "outset";
  labelOffset: number;
  fontSize: number;
  visible: boolean;
}) {
  const indexPosition = uniqueValueIndices.get(String(tick)) ?? tick;
  const tickPosition = tick;

  const p1 = vec(xScale(tickPosition), yScale(y2));
  const p2 = vec(xScale(tickPosition), yScale(y1));

  const val = isNumericalData ? tick : ix[indexPosition];

  const contentXValue = formatXLabel(val);
  const contentX =
    typeof contentXValue === "string" ? contentXValue : contentXValue.top;
  const contentXBottom =
    typeof contentXValue === "string" ? null : contentXValue.bottom;
  const labelWidth =
    font
      ?.getGlyphWidths?.(font.getGlyphIDs(contentX))
      .reduce((sum, value) => sum + value, 0) ?? 0;
  const labelWidthBottom =
    contentXBottom && secondaryXFont
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
    } else if (index > 0) {
      const prevTick = arr[index - 1];
      const spacing = xScale(tick) - xScale(prevTick);
      centerX = xScale(tick) + spacing / 2;
    } else {
      centerX = xScale(tick);
    }
    labelX = centerX - labelWidth / 2;
    labelXBottom = centerX - labelWidthBottom / 2;
  } else {
    labelX = xScale(tick) - (labelWidth ?? 0) / 2;
    labelXBottom = xScale(tick) - (labelWidthBottom ?? 0) / 2;
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
  const origin: SkPoint | undefined = undefined;
  const actualClipPath = useMemo(() => {
    return ignoreClip ? undefined : boundsToClip(chartBounds);
  }, [ignoreClip, chartBounds]);

  if (!visible) return null;

  const translateX =
    index === 0 ? 10 : index === xTicksNormalized.length - 1 ? -4 : 0;

  return (
    <Group key={`x-tick-${String(tick)}`} clip={actualClipPath}>
      <Group transform={transformX}>
        {lineWidth > 0 ? (
          <Group>
            <Line p1={p1} p2={p2} color={lineColor} strokeWidth={lineWidth} />
          </Group>
        ) : null}
        {font && labelWidth && canFitLabelContent ? (
          <Group>
            <Text
              transform={[{ translateX }]}
              origin={origin}
              color={labelColor}
              text={contentX}
              font={font}
              y={labelY}
              x={labelX}
            />
            {contentXBottom ? (
              <Text
                transform={[{ translateX }]}
                origin={origin}
                color={labelColor}
                text={contentXBottom}
                font={secondaryXFont || font}
                y={labelY + 15}
                x={labelXBottom}
              />
            ) : null}
          </Group>
        ) : null}
      </Group>
    </Group>
  );
}

function useProcessAndReportTicks<
  RawData extends Record<string, unknown>,
  XK extends keyof InputFields<RawData>,
>({
  scrollX,
  scrollXDerived,
  chartBounds,
  xTicksNormalized,
  onVisibleTicksChange,
  uniqueValueIndices,
  isNumericalData,
  ix,
  xScale,
  isScrolling,
  labelXCenter,
}: {
  scrollX: SharedValue<number>;
  ix: InputFields<RawData>[XK][];
  xScale: Scale;
  chartBounds: { left: number; right: number };
  xTicksNormalized: number[];
  onVisibleTicksChange?: (visibleTickData: Array<ValueOf<RawData[XK]>>) => void;
  uniqueValueIndices: Map<string, number>;
  isNumericalData: boolean;
  scrollXDerived: SharedValue<number>;
  isScrolling: SharedValue<boolean>;
  labelXCenter: boolean;
}) {
  const scaleDomain = useMemo(() => xScale.domain(), [xScale]);
  const scaleRange = useMemo(() => xScale.range(), [xScale]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: keep sroll x
  const handleProcessAndReportTicks = useMemo(() => {
    return (ticksInRange: Array<number>) => {
      if (!onVisibleTicksChange) return;
      const actualVisibleData: Array<ValueOf<RawData[XK]>> = [];
      ticksInRange.forEach((tick) => {
        const numericTick = Number(tick);
        if (Number.isNaN(numericTick)) return;
        const indexPosition = uniqueValueIndices.get(String(tick)) ?? tick;
        const dataValue = (
          isNumericalData ? tick : ix[indexPosition as number]
        ) as ValueOf<RawData[XK]>;
        actualVisibleData.push(dataValue);
      });
      onVisibleTicksChange(actualVisibleData);
    };
  }, [
    onVisibleTicksChange,
    scrollX, // KEEP: Include scrollX to read latest value inside
    uniqueValueIndices,
    isNumericalData,
    ix,
  ]);

  // Debounce the JS processing function
  const debouncedProcessAndReportTicks = useMemo(() => {
    return debounce(handleProcessAndReportTicks, 50); // Adjust debounce time (ms) as needed
  }, [handleProcessAndReportTicks]);

  useAnimatedReaction(
    () => {
      // Prepare: Calculate first/last visible tick heuristic
      "worklet";
      const [d0, d1] = scaleDomain;
      const [r0, r1] = scaleRange;
      const domainSpan = d1 - d0;

      const scaleWorklet = (value: number): number => {
        if (domainSpan === 0) return r0;
        return r0 + ((value - d0) / domainSpan) * (r1 - r0);
      };

      const chartBoundsRight = chartBounds.right;
      const chartBoundsLeft = chartBounds.left;

      const totalWidth = chartBoundsRight - chartBoundsLeft;
      const renderWidth = totalWidth * 4;

      let firstVisibleTick: ValueOf<RawData[XK]> | number | string | null =
        null;
      let lastVisibleTick: ValueOf<RawData[XK]> | number | string | null = null;
      const ticksInRange: Array<number> = [];
      const ticksInRangeWithBuffer: Array<number> = [];

      for (const tick of xTicksNormalized) {
        const numericTick = Number(tick);
        if (Number.isNaN(numericTick)) continue;

        const tickPixelX = scaleWorklet(numericTick);
        const scrolledPixelX = tickPixelX + scrollXDerived.value;

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
        // this is for the virtualization state
        ticksInRangeWithBuffer.push(tick);

        // Now, check if it's also within the strictly visible chartBounds for the callback.
        const detectionOffset = labelXCenter ? 30 : 0;
        if (
          scrolledPixelX >= chartBoundsLeft - detectionOffset &&
          scrolledPixelX <= chartBoundsRight - detectionOffset
        ) {
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
        isScrolling: isScrolling.value,
      };
    },
    (current, previous) => {
      "worklet";
      if (
        isScrolling.value &&
        (previous === null ||
          current.first !== previous.first ||
          current.last !== previous.last)
      ) {
        runOnJS(debouncedProcessAndReportTicks)(current.ticksInRange); // Call the debounced function
      }
    },
    // Dependencies for the reaction prepare block
    [
      labelXCenter,
      scrollX,
      scaleDomain,
      scaleRange,
      chartBounds,
      xTicksNormalized,
      debouncedProcessAndReportTicks,
      isScrolling,
    ], // Use debounced function in deps
  );
}

export const XAxis = memo(MemoizedXAxis);

export const XAxisDefaults = {
  lineColor: "hsla(0, 0%, 0%, 0.25)",
  lineWidth: StyleSheet.hairlineWidth,
  tickCount: 5,
  labelOffset: 2,
  axisSide: "bottom",
  yAxisSide: "left",
  labelPosition: "outset",
  formatXLabel: (label: ValueOf<InputDatum>) => String(label),
  labelColor: "#000000",
  labelRotate: 0,
} satisfies XAxisPropsWithDefaults<never, never>;
