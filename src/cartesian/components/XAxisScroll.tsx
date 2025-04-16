import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import {
  Group,
  Line,
  Text,
  vec,
  type SkPoint,
} from "@shopify/react-native-skia";
import { getOffsetFromAngle } from "../../utils/getOffsetFromAngle";
import { boundsToClip } from "../../utils/boundsToClip";
import { DEFAULT_TICK_COUNT, downsampleTicks } from "../../utils/tickHelpers";
import type {
  InputDatum,
  InputFields,
  ValueOf,
  XAxisProps,
  XAxisPropsWithDefaults,
  ChartBounds,
} from "../../types";
import {
  runOnJS,
  type SharedValue,
  useDerivedValue,
  useSharedValue,
  useAnimatedReaction,
} from "react-native-reanimated";
import type { ScaleLinear } from "d3-scale"; // Assuming xScale is compatible
import isEqual from "react-fast-compare";
import { on } from "events";

export const XAxis = <
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
}: XAxisProps<RawData, XK> & {
  scrollX: SharedValue<number>;
  ignoreClip: boolean;
  onVisibleTicksChange?: (visibleTickData: Array<ValueOf<RawData[XK]>>) => void;
}) => {
  const transformX = useDerivedValue(() => {
    "worklet";
    return [{ translateX: -scrollX.value }];
  }, [scrollX]);

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
  const lastReportedVisibleTicksRef = useRef<Array<
    ValueOf<RawData[XK]>
  > | null>(null);

  // --- Optimal Visible Ticks Reaction ---
  const scaleDomain = useMemo(() => xScale.domain(), [xScale]);
  const scaleRange = useMemo(() => xScale.range(), [xScale]);

  // Memoize the JS processing function reference
  const processAndReportTicks = useMemo(() => {
    // This function runs on the JS thread via runOnJS
    return () => {
      if (!onVisibleTicksChange) return;

      // Recalculate the full list accurately on JS thread
      const actualVisibleData: Array<ValueOf<RawData[XK]>> = [];
      const currentScrollX = scrollX.value; // Read latest scroll value

      xTicksNormalized.forEach((tick) => {
        const numericTick = Number(tick);
        if (Number.isNaN(numericTick)) return;

        // Use the JS scale here
        const tickPixelX = xScale(numericTick);
        const scrolledPixelX = tickPixelX - currentScrollX;

        if (
          scrolledPixelX >= chartBounds.left &&
          scrolledPixelX <= chartBounds.right
        ) {
          const indexPosition = uniqueValueIndices.get(String(tick)) ?? tick;
          const dataValue = (
            isNumericalData ? tick : ix[indexPosition as number]
          ) as ValueOf<RawData[XK]>;
          actualVisibleData.push(dataValue);
        }
      });

      // Compare with previous and call callback if changed
      if (!isEqual(lastReportedVisibleTicksRef.current, actualVisibleData)) {
        lastReportedVisibleTicksRef.current = actualVisibleData; // Update ref
        onVisibleTicksChange(actualVisibleData); // Call the user's callback
      }
    };
  }, [
    onVisibleTicksChange,
    scrollX, // Include scrollX to read latest value inside
    xTicksNormalized,
    xScale, // Use JS Scale
    chartBounds,
    uniqueValueIndices,
    isNumericalData,
    ix,
  ]);

  // React to scroll changes on UI thread
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

      let firstVisibleTick: ValueOf<RawData[XK]> | number | string | null =
        null;
      let lastVisibleTick: ValueOf<RawData[XK]> | number | string | null = null;

      for (const tick of xTicksNormalized) {
        const numericTick = Number(tick);
        if (Number.isNaN(numericTick)) continue;

        const tickPixelX = scaleWorklet(numericTick);
        const scrolledPixelX = tickPixelX - scrollX.value;

        if (
          scrolledPixelX >= chartBounds.left &&
          scrolledPixelX <= chartBounds.right
        ) {
          if (firstVisibleTick === null) {
            firstVisibleTick = tick; // Found the first one
          }
          lastVisibleTick = tick; // Keep updating last one found in range
        } else if (firstVisibleTick !== null) {
          // Optimization: if we found the first and are now past the right bound, we can stop.
          // Requires ticks to be sorted, which xScale.ticks() usually ensures.
          if (scrolledPixelX > chartBounds.right) break;
        }
      }
      // Return the heuristic value
      return { first: firstVisibleTick, last: lastVisibleTick };
    },
    (current, previous) => {
      // React: Trigger JS processing only if heuristic changes
      "worklet";
      // Trigger if previous is null or if first/last differs
      if (
        previous === null ||
        current.first !== previous.first ||
        current.last !== previous.last
      ) {
        runOnJS(processAndReportTicks)();
      }
    },
    // Dependencies for the reaction prepare block
    [
      scrollX,
      scaleDomain,
      scaleRange,
      chartBounds,
      xTicksNormalized,
      processAndReportTicks,
    ],
  );

  const xAxisNodes = xTicksNormalized.map((tick, index) => {
    // Use the first occurrence index for positioning if available
    const indexPosition = uniqueValueIndices.get(String(tick)) ?? tick;
    const tickPosition = tick;

    const p1 = vec(xScale(tickPosition), yScale(y2));
    const p2 = vec(xScale(tickPosition), yScale(y1));

    const val = isNumericalData ? tick : ix[indexPosition];

    const contentX = formatXLabel(val as never);
    const labelWidth =
      font
        ?.getGlyphWidths?.(font.getGlyphIDs(contentX))
        .reduce((sum, value) => sum + value, 0) ?? 0;
    // const labelX = xScale(indexPosition) - (labelWidth ?? 0) / 2 - this does not work when the viewport is not [0,N] AND IS [N,N]
    const labelX = xScale(tick) - (labelWidth ?? 0) / 2;

    const canFitLabelContent = true;

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
    const { origin, rotateOffset } = ((): {
      origin: SkPoint | undefined;
      rotateOffset: number;
    } => {
      let rotateOffset = 0;
      let origin;

      // return defaults if no labelRotate is provided
      if (!labelRotate) return { origin, rotateOffset };

      if (axisSide === "bottom" && labelPosition === "outset") {
        // bottom, outset
        origin = vec(labelX + labelWidth / 2, labelY);
        rotateOffset = Math.abs(
          (labelWidth / 2) * getOffsetFromAngle(labelRotate),
        );
      } else if (axisSide === "bottom" && labelPosition === "inset") {
        // bottom, inset
        origin = vec(labelX + labelWidth / 2, labelY);
        rotateOffset = -Math.abs(
          (labelWidth / 2) * getOffsetFromAngle(labelRotate),
        );
      } else if (axisSide === "top" && labelPosition === "inset") {
        // top, inset
        origin = vec(labelX + labelWidth / 2, labelY - fontSize / 4);
        rotateOffset = Math.abs(
          (labelWidth / 2) * getOffsetFromAngle(labelRotate),
        );
      } else {
        // top, outset
        origin = vec(labelX + labelWidth / 2, labelY - fontSize / 4);
        rotateOffset = -Math.abs(
          (labelWidth / 2) * getOffsetFromAngle(labelRotate),
        );
      }

      return { origin, rotateOffset };
    })();

    return (
      <React.Fragment key={`x-tick-${String(tick)}`}>
        {lineWidth > 0 ? (
          <Group
            transform={transformX}
            clip={ignoreClip ? boundsToClip(chartBounds) : undefined}
          >
            <Line p1={p1} p2={p2} color={lineColor} strokeWidth={lineWidth}>
              {linePathEffect ? linePathEffect : null}
            </Line>
          </Group>
        ) : null}
        {font && labelWidth && canFitLabelContent ? (
          <Group
            transform={transformX}
            clip={ignoreClip ? boundsToClip(chartBounds) : undefined}
          >
            <Text
              transform={[
                {
                  translateX: index === 0 ? 10 : 0,
                  rotate: (Math.PI / 180) * (labelRotate ?? 0),
                },
              ]}
              origin={origin}
              color={labelColor}
              text={contentX}
              font={font}
              y={labelY}
              x={labelX}
            />
          </Group>
        ) : null}
      </React.Fragment>
    );
  });

  return xAxisNodes;
};

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
