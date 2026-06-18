import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsCandleCount, docsInterval } from "../chartExampleData";
import {
  candleAtViewRatio,
  penultimateCandle,
  showcaseCandles,
} from "./drawingShowcaseAnchors";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  applyDocsChartPreset,
  alignDocsChartViewport,
  docsChartEmbedBackground,
  getDocsChartCreateOptions,
} from "../docsChartTheme";
import showcaseStyles from "../docsShowcase.module.css";
import { docsShowcasePalette as palette } from "../docsShowcasePalette";

type DrawingPresetKey =
  | "trendLine"
  | "trendRay"
  | "parallelChannel"
  | "pitchfork"
  | "regressionChannel"
  | "gannFan"
  | "gannGrid"
  | "gannBox"
  | "fibonLines"
  | "fibonExtension"
  | "fibonTimeZone"
  | "fibonChannel"
  | "fibonArcs"
  | "fibonCircles"
  | "abcd"
  | "arrow"
  | "brush"
  | "ellipse"
  | "triangle"
  | "box"
  | "cycle"
  | "textAnnotation"
  | "hLine"
  | "vLine"
  | "hRay"
  | "vRay"
  | "crossLine"
  | "mLine"
  | "hRange"
  | "vRange"
  | "timeRange"
  | "timeBet"
  | "priceTag"
  | "fixedRangeVolumeProfile"
  | "longShortPosition";

/** Every interactive preset in this showcase — use for the full tool reference page. */
export const allDrawingShowcasePresets: DrawingPresetKey[] = [
  "trendLine",
  "trendRay",
  "hLine",
  "vLine",
  "hRay",
  "vRay",
  "crossLine",
  "mLine",
  "parallelChannel",
  "pitchfork",
  "regressionChannel",
  "fibonLines",
  "fibonExtension",
  "fibonTimeZone",
  "fibonChannel",
  "fibonArcs",
  "fibonCircles",
  "abcd",
  "gannFan",
  "gannGrid",
  "gannBox",
  "hRange",
  "vRange",
  "timeRange",
  "timeBet",
  "priceTag",
  "arrow",
  "brush",
  "ellipse",
  "triangle",
  "box",
  "cycle",
  "textAnnotation",
  "fixedRangeVolumeProfile",
  "longShortPosition",
];

interface DrawingToolShowcaseProps {
  visiblePresets?: DrawingPresetKey[];
  initialPreset?: DrawingPresetKey;
}

interface DrawingPresetDefinition {
  label: string;
  api: string;
  runtimeType: string;
  description: string;
  draw(chart: ChartInstance): Array<string | number>;
}

const defaultVisiblePresets: DrawingPresetKey[] = [
  "trendLine",
  "fibonLines",
  "hLine",
  "timeRange",
  "timeBet",
];

const candles = showcaseCandles;

function candleAt(ratio: number) {
  return candleAtViewRatio(ratio);
}

function rightCandle() {
  return penultimateCandle();
}

const collectToolIds = (...ids: Array<string | number | void>): Array<string | number> => {
  return ids.filter((id): id is string | number => id !== undefined);
};

const definitions: Record<DrawingPresetKey, DrawingPresetDefinition> = {
  trendLine: {
    label: "Trend line",
    api: "toolDrawer.drawTrendLine()",
    runtimeType: "trendLine",
    description:
      "Two anchors define the direction. This is the cleanest programmatic entry point for support, resistance, and trend projection.",
    draw(chart) {
      const start = candleAt(0.18);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTrendLine({
          startStamp: start.stamp,
          endStamp: end.stamp,
          startPrice: start.l,
          endPrice: end.c,
          config: {
            editable: false,
            color: palette.accent,
          },
        })
      );
    },
  },
  trendRay: {
    label: "Trend ray",
    api: 'toolDrawer.drawTool({ type: "trendRay" })',
    runtimeType: "trendRay",
    description:
      "Two anchors define direction, but the line extends as a ray from the origin toward the plot edge.",
    draw(chart) {
      const start = candleAt(0.24);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "trendRay",
          color: palette.accent,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  parallelChannel: {
    label: "Parallel channel",
    api: 'toolDrawer.drawTool({ type: "parallelChannel" })',
    runtimeType: "parallelChannel",
    description:
      "Three anchors define the channel. Use it when you need directional structure plus a projected width.",
    draw(chart) {
      const start = candleAt(0.22);
      const end = rightCandle();
      const widthAnchor = candleAt(0.48);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "parallelChannel",
          color: palette.success,
          fillBg: false,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "left",
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "right",
            },
            {
              stamp: widthAnchor.stamp,
              offset: 0,
              value: widthAnchor.l,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  pitchfork: {
    label: "Pitchfork",
    api: 'toolDrawer.drawTool({ type: "pitchfork" })',
    runtimeType: "pitchfork",
    description:
      "Andrews pitchfork: anchor 1 is the pivot, anchors 2–3 define the baseline. The median line runs through the pivot and the baseline midpoint; outer prongs stay parallel.",
    draw(chart) {
      const pivot = candleAt(0.28);
      const baseA = candleAt(0.52);
      const baseB = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "pitchfork",
          color: palette.accent,
          width: 1,
          anchors: [
            { stamp: pivot.stamp, offset: 0, value: pivot.h, _index: 0 },
            { stamp: baseA.stamp, offset: 0, value: baseA.l, _index: 0 },
            { stamp: baseB.stamp, offset: 0, value: baseB.c, _index: 0 },
          ],
        }),
      );
    },
  },
  regressionChannel: {
    label: "Regression channel",
    api: 'toolDrawer.drawTool({ type: "regressionChannel" })',
    runtimeType: "regressionChannel",
    description:
      "Two anchors define the time range. The engine fits a linear regression on close prices and draws ±σ channel lines (default −2σ, 0, +2σ).",
    draw(chart) {
      const start = candleAt(0.22);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "regressionChannel",
          color: palette.accent,
          width: 1,
          source: "c",
          fillBg: true,
          values: [-2, -1, 0, 1, 2],
          valuesState: [true, false, true, false, true],
          anchors: [
            { stamp: start.stamp, offset: 0, value: start.c, _index: 0 },
            { stamp: end.stamp, offset: 0, value: end.c, _index: 0 },
          ],
        }),
      );
    },
  },
  gannFan: {
    label: "Gann fan",
    api: 'toolDrawer.drawTool({ type: "gannFan" })',
    runtimeType: "gannFan",
    description:
      "Two anchors: origin plus the 1x1 reference point. Rays use standard Gann price:time ratios.",
    draw(chart) {
      const origin = candleAt(0.3);
      const reference = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "gannFan",
          color: palette.warning,
          width: 1,
          anchors: [
            { stamp: origin.stamp, offset: 0, value: origin.l, _index: 0 },
            { stamp: reference.stamp, offset: 0, value: reference.h, _index: 0 },
          ],
        }),
      );
    },
  },
  gannGrid: {
    label: "Gann grid",
    api: 'toolDrawer.drawTool({ type: "gannGrid" })',
    runtimeType: "gannGrid",
    description: "Two opposite corners define a box subdivided at 1/8 intervals on both axes.",
    draw(chart) {
      const topLeft = candleAt(0.35);
      const bottomRight = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "gannGrid",
          color: palette.accent,
          width: 1,
          anchors: [
            { stamp: topLeft.stamp, offset: 0, value: topLeft.h, _index: 0 },
            { stamp: bottomRight.stamp, offset: 0, value: bottomRight.l, _index: 0 },
          ],
        }),
      );
    },
  },
  gannBox: {
    label: "Gann box",
    api: 'toolDrawer.drawTool({ type: "gannBox" })',
    runtimeType: "gannBox",
    description: "Gann grid plus fan diagonals from the first anchor, clipped to the box.",
    draw(chart) {
      const topLeft = candleAt(0.32);
      const bottomRight = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "gannBox",
          color: palette.success,
          width: 1,
          anchors: [
            { stamp: topLeft.stamp, offset: 0, value: topLeft.h, _index: 0 },
            { stamp: bottomRight.stamp, offset: 0, value: bottomRight.l, _index: 0 },
          ],
        }),
      );
    },
  },
  fibonLines: {
    label: "Fibonacci levels",
    api: 'toolDrawer.drawTool({ type: "fibonLines" })',
    runtimeType: "fibonLines",
    description:
      "Use two anchors to define the measured move, then pass the retracement or extension levels that should render.",
    draw(chart) {
      const start = candleAt(0.32);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonLines",
          color: palette.warning,
          width: 1,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "left",
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "right",
            },
          ],
          values: [0, 23.6, 38.2, 50, 61.8, 78.6, 100, 161.8],
          valuesState: [true, true, true, true, true, true, true, false],
          valuesCanAdd: true,
          valuesCanDelete: true,
        })
      );
    },
  },
  fibonExtension: {
    label: "Fibonacci extension",
    api: 'toolDrawer.drawTool({ type: "fibonExtension" })',
    runtimeType: "fibonExtension",
    description:
      "Use two anchors to define the swing, then project extension levels beyond 100% in the trend direction.",
    draw(chart) {
      const start = candleAt(0.32);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonExtension",
          color: palette.accent,
          width: 1,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "left",
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "right",
            },
          ],
          values: [100, 127.2, 141.4, 161.8, 200, 261.8],
          valuesState: [true, true, true, true, true, true],
          valuesCanAdd: true,
          valuesCanDelete: true,
        })
      );
    },
  },
  fibonTimeZone: {
    label: "Fibonacci time zone",
    api: 'toolDrawer.drawTool({ type: "fibonTimeZone" })',
    runtimeType: "fibonTimeZone",
    description:
      "Two anchors define the unit time span. Vertical lines appear at Fibonacci multiples (0, 1, 1, 2, 3, 5, 8, …) from the origin.",
    draw(chart) {
      const start = candleAt(0.3);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonTimeZone",
          color: palette.violet,
          width: 1,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
            },
          ],
          values: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
          valuesState: [true, true, true, true, true, true, true, true, true, true, false, false],
          valuesCanAdd: true,
          valuesCanDelete: true,
        }),
      );
    },
  },
  fibonChannel: {
    label: "Fibonacci channel",
    api: 'toolDrawer.drawTool({ type: "fibonChannel" })',
    runtimeType: "fibonChannel",
    description:
      "Three anchors: trend line (1–2) plus channel width (3). Parallel Fibonacci levels fill the channel.",
    draw(chart) {
      const start = candleAt(0.25);
      const end = rightCandle();
      const width = candleAt(0.42);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonChannel",
          color: palette.accent,
          width: 1,
          fillBg: true,
          values: [0, 23.6, 38.2, 50, 61.8, 78.6, 100],
          valuesState: [true, true, true, true, true, true, true],
          valuesCanAdd: true,
          valuesCanDelete: true,
          anchors: [
            { stamp: start.stamp, offset: 0, value: start.l, _index: 0 },
            { stamp: end.stamp, offset: 0, value: end.c, _index: 0 },
            { stamp: width.stamp, offset: 0, value: width.h, _index: 0 },
          ],
        }),
      );
    },
  },
  fibonArcs: {
    label: "Fibonacci arcs",
    api: 'toolDrawer.drawTool({ type: "fibonArcs" })',
    runtimeType: "fibonArcs",
    description:
      "Center anchor plus radius anchor. Semi-elliptical arcs at Fibonacci fractions of the radius.",
    draw(chart) {
      const center = candleAt(0.28);
      const radius = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonArcs",
          color: palette.violet,
          width: 1,
          values: [23.6, 38.2, 50, 61.8, 78.6, 100],
          valuesState: [true, true, true, true, true, true],
          valuesCanAdd: true,
          valuesCanDelete: true,
          anchors: [
            { stamp: center.stamp, offset: 0, value: center.l, _index: 0 },
            { stamp: radius.stamp, offset: 0, value: radius.h, _index: 0 },
          ],
        }),
      );
    },
  },
  fibonCircles: {
    label: "Fibonacci circles",
    api: 'toolDrawer.drawTool({ type: "fibonCircles" })',
    runtimeType: "fibonCircles",
    description:
      "Center anchor plus radius anchor. Full concentric circles at Fibonacci fractions of the distance.",
    draw(chart) {
      const center = candleAt(0.32);
      const radius = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonCircles",
          color: palette.violetSoft,
          width: 1,
          values: [23.6, 38.2, 50, 61.8, 78.6, 100],
          valuesState: [true, true, true, true, true, true],
          valuesCanAdd: true,
          valuesCanDelete: true,
          anchors: [
            { stamp: center.stamp, offset: 0, value: center.l, _index: 0 },
            { stamp: radius.stamp, offset: 0, value: radius.h, _index: 0 },
          ],
        }),
      );
    },
  },
  abcd: {
    label: "ABCD projection",
    api: 'toolDrawer.drawTool({ type: "abcd" })',
    runtimeType: "abcd",
    description:
      "This measured-move projection uses three anchors plus extension levels to map a candidate continuation.",
    draw(chart) {
      const first = candleAt(0.28);
      const second = candleAt(0.42);
      const third = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "abcd",
          color: palette.orange,
          anchors: [
            { stamp: first.stamp, offset: 0, value: first.l, _index: 0 },
            { stamp: second.stamp, offset: 0, value: second.h, _index: 0 },
            {
              stamp: third.stamp,
              offset: 0,
              value: third.c,
              _index: 0,
              expandable: true,
              expanded: false,
              defaultDirection: "right",
            },
          ],
          values: [38.2, 50, 61.8, 100, 161.8],
          valuesState: [true, true, true, true, true],
        })
      );
    },
  },
  arrow: {
    label: "Arrow",
    api: 'toolDrawer.drawTool({ type: "arrow" })',
    runtimeType: "arrow",
    description:
      "Use this when you need a directional callout without adding a full range or geometric zone.",
    draw(chart) {
      const start = candleAt(0.68);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "arrow",
          color: palette.warning,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.h,
              _index: 0,
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  brush: {
    label: "Brush",
    api: 'toolDrawer.drawTool({ type: "brush" })',
    runtimeType: "brush",
    description:
      "Freehand annotation: click and drag on the chart to draw, release to finish. The stroke is stored as sampled chart anchors.",
    draw(chart) {
      const ratios = [0.45, 0.52, 0.6, 0.68, 0.76, 0.84, 0.92, 0.97, 1];
      const heightRatios = [0.35, 0.42, 0.52, 0.62, 0.72, 0.78, 0.68, 0.55, 0.45];
      const anchors = ratios.map((ratio, index) => {
        const candle = candleAt(ratio);
        const span = candle.h - candle.l;
        return {
          stamp: candle.stamp,
          offset: 0,
          value: candle.l + span * (heightRatios[index] ?? 0),
          _index: 0,
        };
      });

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "brush",
          color: palette.warning,
          width: 2,
          fillBg: true,
          backgroundColor: palette.warning,
          backgroundOpacity: 0.22,
          anchors,
        }),
      );
    },
  },
  ellipse: {
    label: "Ellipse",
    api: 'toolDrawer.drawTool({ type: "ellipse" })',
    runtimeType: "ellipse",
    description:
      "Use an ellipse to surround an area of interest without projecting a directional bias the way a channel or arrow does.",
    draw(chart) {
      const start = candleAt(0.58);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "ellipse",
          color: palette.accent,
          fillBg: false,
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  triangle: {
    label: "Triangle",
    api: 'toolDrawer.drawTool({ type: "triangle" })',
    runtimeType: "triangle",
    description:
      "Triangles are useful when you want a three-point geometric zone instead of a simple two-corner box or ellipse.",
    draw(chart) {
      const first = candleAt(0.34);
      const second = candleAt(0.44);
      const third = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "triangle",
          color: palette.positionLoss,
          fillBg: true,
          anchors: [
            {
              stamp: first.stamp,
              offset: 0,
              value: first.l,
              _index: 0,
            },
            {
              stamp: second.stamp,
              offset: 0,
              value: second.h,
              _index: 0,
            },
            {
              stamp: third.stamp,
              offset: 0,
              value: third.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  box: {
    label: "Rectangle",
    api: 'toolDrawer.drawTool({ type: "box" })',
    runtimeType: "box",
    description:
      "A box is the clearest choice for highlighting supply, demand, or consolidation zones with simple two-corner placement.",
    draw(chart) {
      const start = candleAt(0.24);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "box",
          color: palette.success,
          fillBg: true,
          style: "line",
          anchors: [
            {
              stamp: start.stamp,
              offset: 0,
              value: start.l,
              _index: 0,
            },
            {
              stamp: end.stamp,
              offset: 0,
              value: end.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  cycle: {
    label: "Cycle",
    api: 'toolDrawer.drawTool({ type: "cycle" })',
    runtimeType: "cycle",
    description:
      "Use cycle when you want to emphasize repeated spacing or cadence between time points instead of a price-defined range.",
    draw(chart) {
      const first = candleAt(0.52);
      const second = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "cycle",
          color: palette.accent,
          style: "line",
          anchors: [
            {
              stamp: first.stamp,
              offset: 0,
              value: first.c,
              _index: 0,
            },
            {
              stamp: second.stamp,
              offset: 0,
              value: second.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  textAnnotation: {
    label: "Text annotation",
    api: 'toolDrawer.drawTool({ type: "textAnnotation" })',
    runtimeType: "textAnnotation",
    description:
      "This is the programmatic path for freeform labels when you want a note on the chart without relying on the current visible left-menu surface.",
    draw(chart) {
      const first = candleAt(0.72);
      const second = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "textAnnotation",
          color: palette.label,
          text: "Supply zone",
          fontSize: 13,
          anchors: [
            {
              stamp: first.stamp,
              offset: 0,
              value: first.h,
              _index: 0,
            },
            {
              stamp: second.stamp,
              offset: 0,
              value: second.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  hLine: {
    label: "Horizontal line",
    api: 'toolDrawer.drawTool({ type: "hLine" })',
    runtimeType: "hLine",
    description:
      "The simplest price-level marker. A single anchor and optional price tag make it useful for levels users need to revisit.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "hLine",
          color: palette.success,
          priceTag: true,
          anchors: [
            {
              stamp: anchor.stamp,
              offset: 0,
              value: anchor.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  hRay: {
    label: "Horizontal ray",
    api: 'toolDrawer.drawTool({ type: "hRay" })',
    runtimeType: "hRay",
    description:
      "A single anchor starts a horizontal ray that runs to the right edge of the plot.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "hRay",
          color: palette.success,
          priceTag: true,
          anchors: [
            {
              stamp: anchor.stamp,
              offset: 0,
              value: anchor.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  vRay: {
    label: "Vertical ray",
    api: 'toolDrawer.drawTool({ type: "vRay" })',
    runtimeType: "vRay",
    description:
      "A single anchor starts a vertical ray that runs downward to the bottom of the panel.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "vRay",
          color: palette.warning,
          anchors: [
            {
              stamp: anchor.stamp,
              offset: 0,
              value: anchor.h,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  crossLine: {
    label: "Cross line",
    api: 'toolDrawer.drawTool({ type: "crossLine" })',
    runtimeType: "crossLine",
    description:
      "One anchor draws both a horizontal and vertical line through the same point.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "crossLine",
          color: palette.label,
          anchors: [
            {
              stamp: anchor.stamp,
              offset: 0,
              value: anchor.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  timeRange: {
    label: "Time range",
    api: "toolDrawer.drawTimeRange()",
    runtimeType: "timeRange",
    description:
      "A bounded session or review window keyed by start time and duration instead of raw anchors.",
    draw(chart) {
      const start = candleAt(0.5);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTimeRange({
          text: "Review range",
          startTime: start.stamp,
          timeRange: Math.max(docsInterval.milis, end.stamp - start.stamp),
          config: {
            editable: false,
            color: palette.accent,
            secondaryColor: "rgba(255, 255, 255, 0.08)",
            textColor: palette.label,
          },
        })
      );
    },
  },
  timeBet: {
    label: "Time bet",
    api: "toolDrawer.drawTimeBet()",
    runtimeType: "timeBet",
    description:
      "This helper creates a directional, time-bound outcome box using price, reward, bet size, and status metadata.",
    draw(chart) {
      const start = candleAt(0.55);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTimeBet({
          startTime: start.stamp,
          timeRange: Math.max(docsInterval.milis, end.stamp - start.stamp),
          price: end.c,
          reward: 125,
          bet: 50,
          predictedDirection: "UP",
          status: "ACTIVE",
          isWinning: true,
          config: {
            editable: false,
            color: "rgba(12, 18, 33, 0.72)",
            winningColor: palette.positionWin,
            losingColor: palette.positionLoss,
            secondaryColor: "rgba(255, 255, 255, 0.1)",
            textColor: palette.label,
            priceTag: true,
          },
        })
      );
    },
  },
  priceTag: {
    label: "Price tag",
    api: 'toolDrawer.drawTool({ type: "priceTag" })',
    runtimeType: "priceTag",
    description:
      "Pin a standalone price marker without drawing a full horizontal level across the chart.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "priceTag",
          color: palette.positionLoss,
          anchors: [
            {
              stamp: anchor.stamp,
              offset: 0,
              value: anchor.c,
              _index: 0,
            },
          ],
        })
      );
    },
  },
  vLine: {
    label: "Vertical line",
    api: 'toolDrawer.drawTool({ type: "vLine" })',
    runtimeType: "vLine",
    description: "Mark a moment in time with a vertical line across the full panel height.",
    draw(chart) {
      const anchor = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "vLine",
          color: palette.warning,
          anchors: [{ stamp: anchor.stamp, offset: 0, value: anchor.c, _index: 0 }],
        })
      );
    },
  },
  mLine: {
    label: "Multi-line",
    api: 'toolDrawer.drawTool({ type: "mLine" })',
    runtimeType: "mLine",
    description: "Connect three or more anchor points with a custom polyline.",
    draw(chart) {
      const a = candleAt(0.2);
      const b = candleAt(0.42);
      const c = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "mLine",
          color: palette.accent,
          width: 2,
          anchors: [
            { stamp: a.stamp, offset: 0, value: a.l, _index: 0 },
            { stamp: b.stamp, offset: 0, value: b.h, _index: 0 },
            { stamp: c.stamp, offset: 0, value: c.c, _index: 0 },
          ],
        })
      );
    },
  },
  hRange: {
    label: "Horizontal range",
    api: 'toolDrawer.drawTool({ type: "hRange" })',
    runtimeType: "hRange",
    description: "Measure and label a price distance between two horizontal levels.",
    draw(chart) {
      const low = candleAt(0.48);
      const high = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "hRange",
          color: palette.success,
          text: "Price span",
          anchors: [
            { stamp: low.stamp, offset: 0, value: low.l, _index: 0 },
            { stamp: high.stamp, offset: 0, value: high.c, _index: 0 },
          ],
        })
      );
    },
  },
  vRange: {
    label: "Vertical range",
    api: 'toolDrawer.drawTool({ type: "vRange" })',
    runtimeType: "vRange",
    description: "Measure and label a time distance between two vertical positions.",
    draw(chart) {
      const start = candleAt(0.44);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "vRange",
          color: palette.accent,
          text: "Time span",
          anchors: [
            { stamp: start.stamp, offset: 0, value: start.l, _index: 0 },
            { stamp: end.stamp, offset: 0, value: end.c, _index: 0 },
          ],
        })
      );
    },
  },
  fixedRangeVolumeProfile: {
    label: "Volume profile",
    api: 'toolDrawer.drawTool({ type: "fixedRangeVolumeProfile" })',
    runtimeType: "fixedRangeVolumeProfile",
    description:
      "Histogram of traded volume between two time anchors, with optional POC and value-area shading.",
    draw(chart) {
      const start = candleAt(0.3);
      const end = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fixedRangeVolumeProfile",
          color: palette.accent,
          fillBg: true,
          showPoc: true,
          showValueArea: true,
          valueAreaPercent: 70,
          anchors: [
            { stamp: start.stamp, offset: 0, value: start.l, _index: 0 },
            { stamp: end.stamp, offset: 0, value: end.c, _index: 0 },
          ],
        })
      );
    },
  },
  longShortPosition: {
    label: "Long / short position",
    api: "toolDrawer.drawLongShortPosition()",
    runtimeType: "longShortPosition",
    description:
      "Paper-trade planning box with entry, stop, and target — separate from live broker order lines.",
    draw(chart) {
      const entry = candleAt(0.5);
      const stop = candleAt(0.42);
      const target = rightCandle();

      return collectToolIds(
        chart.toolDrawer.drawLongShortPosition({
          direction: "LONG",
          startStamp: entry.stamp,
          endStamp: target.stamp,
          entryPrice: entry.c,
          stopPrice: stop.l,
          targetPrice: target.h,
          riskPercent: 1,
          config: { color: palette.success },
        })
      );
    },
  },
};

export default function DrawingToolShowcase(props: DrawingToolShowcaseProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const activeToolIdsRef = useRef<Array<string | number>>([]);

  const visiblePresets = useMemo(() => {
    const nextVisiblePresets = props.visiblePresets?.length ? props.visiblePresets : defaultVisiblePresets;
    return nextVisiblePresets.filter((presetKey, index, presetKeys) => presetKeys.indexOf(presetKey) === index);
  }, [props.visiblePresets]);

  const fallbackPreset = visiblePresets[0] ?? defaultVisiblePresets[0] ?? ("trendLine" as DrawingPresetKey);
  const resolvedInitialPreset =
    props.initialPreset && visiblePresets.includes(props.initialPreset)
      ? props.initialPreset
      : fallbackPreset;

  const [presetKey, setPresetKey] = useState<DrawingPresetKey>(resolvedInitialPreset);
  const presetRef = useRef<DrawingPresetKey>(resolvedInitialPreset);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visiblePresets.includes(presetKey)) {
      setPresetKey(resolvedInitialPreset);
    }
  }, [presetKey, resolvedInitialPreset, visiblePresets]);

  useEffect(() => {
    presetRef.current = presetKey;
  }, [presetKey]);

  const activePreset = definitions[presetKey];

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const chart = chartModule.createChart({
          container,
          ...getDocsChartCreateOptions(),
        });
        chartRef.current = chart;

        chart.init();
        await chart.setMainSeriesData(candles, docsInterval, false);
        applyDocsChartPreset(chart);
        chart.setMainDrawMode("OHLC");
        activeToolIdsRef.current = definitions[presetRef.current].draw(chart);
        chart.setMainDrawMode("OHLC");
        await alignDocsChartViewport(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load drawing example");
          setLoading(false);
        }
      }
    };

    void mountChart();

    return () => {
      disposed = true;
      activeToolIdsRef.current = [];
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    for (const toolId of activeToolIdsRef.current) {
      chart.toolDrawer.deleteTool(toolId);
    }

    activeToolIdsRef.current = definitions[presetKey].draw(chart);
    chart.setMainDrawMode("OHLC");
    void alignDocsChartViewport(chart);
  }, [presetKey]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <div>
          <span style={styles.controlLabel}>Drawing preset</span>
          {visiblePresets.length > 1 ? (
            <div style={styles.buttonRow}>
              {visiblePresets.map((nextPresetKey) => {
                const definition = definitions[nextPresetKey];

                return (
                  <button
                    key={nextPresetKey}
                    type="button"
                    onClick={() => setPresetKey(nextPresetKey)}
                    style={nextPresetKey === presetKey ? styles.activeButton : styles.button}
                  >
                    {definition.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <p style={styles.singlePresetText}>{activePreset.label}</p>
          )}
        </div>

        <div>
          <span style={styles.controlLabel}>What this example shows</span>
          <p style={styles.description}>{activePreset.description}</p>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span style={styles.metaTag}>Live MDX example</span>
        <span style={styles.metaText}>{activePreset.api}</span>
        <span className={showcaseStyles.metaChip}>{activePreset.runtimeType}</span>
        <span className={showcaseStyles.metaChip}>{docsCandleCount} candles</span>
        <span className={showcaseStyles.metaChip}>BTC/USD fixture</span>
      </div>

      <DocChartEmbed
        minHeight={420}
        height={420}
        background={docsChartEmbedBackground}
        loading={loading}
        error={error}
      >
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>
    </div>
  );
}

const baseButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  border: "1px solid var(--doc-border)",
  background: "transparent",
  color: "var(--doc-text)",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
};

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 20,
    marginTop: 20,
    marginBottom: 28,
  },
  controls: {
    display: "grid",
    gap: 24,
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    padding: 24,
    borderRadius: 20,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  controlLabel: {
    display: "block",
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--doc-text-secondary)",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  button: baseButtonStyle,
  activeButton: {
    ...baseButtonStyle,
    border: "1px solid transparent",
    background: "var(--doc-text)",
    color: "var(--doc-bg)",
  },
  singlePresetText: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 16,
    fontWeight: 600,
  },
  description: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 15,
    lineHeight: 1.6,
  },
  metaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  metaTag: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  metaText: {
    color: "var(--doc-text-secondary)",
    fontSize: 14,
    fontFamily: "var(--ifm-font-family-monospace)",
  },
};