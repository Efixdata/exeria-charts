import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import {
  docsCandleCount,
  docsInterval,
  drawingShowcaseCandles,
  getCandleAtRatio,
} from "../chartExampleData";

type DrawingPresetKey =
  | "trendLine"
  | "parallelChannel"
  | "fibonLines"
  | "abcd"
  | "arrow"
  | "ellipse"
  | "triangle"
  | "box"
  | "cycle"
  | "textAnnotation"
  | "hLine"
  | "timeRange"
  | "timeBet"
  | "priceTag";

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

const candles = drawingShowcaseCandles;

function candleAt(ratio: number) {
  return getCandleAtRatio(candles, ratio);
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
      const end = candleAt(0.62);

      return collectToolIds(
        chart.toolDrawer.drawTrendLine({
          startStamp: start.stamp,
          endStamp: end.stamp,
          startPrice: start.l,
          endPrice: end.h,
          config: {
            editable: false,
            color: "#5cc8ff",
          },
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
      const end = candleAt(0.48);
      const widthAnchor = candleAt(0.48);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "parallelChannel",
          color: "#14f7ab",
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
              value: end.h,
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
  fibonLines: {
    label: "Fibonacci levels",
    api: 'toolDrawer.drawTool({ type: "fibonLines" })',
    runtimeType: "fibonLines",
    description:
      "Use two anchors to define the measured move, then pass the retracement or extension levels that should render.",
    draw(chart) {
      const start = candleAt(0.32);
      const end = candleAt(0.56);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "fibonLines",
          color: "#f0b429",
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
              value: end.h,
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
  abcd: {
    label: "ABCD projection",
    api: 'toolDrawer.drawTool({ type: "abcd" })',
    runtimeType: "abcd",
    description:
      "This measured-move projection uses three anchors plus extension levels to map a candidate continuation.",
    draw(chart) {
      const first = candleAt(0.28);
      const second = candleAt(0.42);
      const third = candleAt(0.6);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "abcd",
          color: "#f97316",
          anchors: [
            { stamp: first.stamp, offset: 0, value: first.l, _index: 0 },
            { stamp: second.stamp, offset: 0, value: second.h, _index: 0 },
            {
              stamp: third.stamp,
              offset: 0,
              value: third.l,
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
      const end = candleAt(0.74);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "arrow",
          color: "#f0b429",
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
              value: end.l,
              _index: 0,
            },
          ],
        })
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
      const end = candleAt(0.7);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "ellipse",
          color: "#5cc8ff",
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
              value: end.h,
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
      const third = candleAt(0.56);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "triangle",
          color: "#D12E59",
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
              value: third.l,
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
      const end = candleAt(0.38);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "box",
          color: "#14f7ab",
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
              value: end.h,
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
      const second = candleAt(0.66);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "cycle",
          color: "#5cc8ff",
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
      const second = candleAt(0.76);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "textAnnotation",
          color: "#F7FBFF",
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
              value: second.h,
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
      const anchor = candleAt(0.7);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "hLine",
          color: "#14f7ab",
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
  timeRange: {
    label: "Time range",
    api: "toolDrawer.drawTimeRange()",
    runtimeType: "timeRange",
    description:
      "A bounded session or review window keyed by start time and duration instead of raw anchors.",
    draw(chart) {
      const start = candleAt(0.54);

      return collectToolIds(
        chart.toolDrawer.drawTimeRange({
          text: "Review range",
          startTime: start.stamp,
          timeRange: 80 * docsInterval.milis,
          config: {
            editable: false,
            color: "#5cc8ff",
            secondaryColor: "rgba(255, 255, 255, 0.08)",
            textColor: "#F7FBFF",
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
      const start = candleAt(0.66);

      return collectToolIds(
        chart.toolDrawer.drawTimeBet({
          startTime: start.stamp,
          timeRange: 64 * docsInterval.milis,
          price: start.c,
          reward: 125,
          bet: 50,
          predictedDirection: "UP",
          status: "ACTIVE",
          isWinning: true,
          config: {
            editable: false,
            color: "rgba(12, 18, 33, 0.72)",
            winningColor: "#25AD98",
            losingColor: "#D12E59",
            secondaryColor: "rgba(255, 255, 255, 0.1)",
            textColor: "#F7FBFF",
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
      const anchor = candleAt(0.82);

      return collectToolIds(
        chart.toolDrawer.drawTool({
          type: "priceTag",
          color: "#D12E59",
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
};

export default function DrawingToolShowcase(props: DrawingToolShowcaseProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const activeToolIdsRef = useRef<Array<string | number>>([]);

  const visiblePresets = useMemo(() => {
    const nextVisiblePresets = props.visiblePresets?.length ? props.visiblePresets : defaultVisiblePresets;
    return nextVisiblePresets.filter((presetKey, index, presetKeys) => presetKeys.indexOf(presetKey) === index);
  }, [props.visiblePresets]);

  const fallbackPreset = visiblePresets[0] ?? defaultVisiblePresets[0];
  const resolvedInitialPreset =
    props.initialPreset && visiblePresets.includes(props.initialPreset)
      ? props.initialPreset
      : fallbackPreset;

  const [presetKey, setPresetKey] = useState<DrawingPresetKey>(resolvedInitialPreset);
  const presetRef = useRef<DrawingPresetKey>(resolvedInitialPreset);

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

      const chartModule = await import("@efixdata/exeria-chart");
      if (disposed) {
        return;
      }

      const chart = chartModule.createChart({ container });
      chartRef.current = chart;

      chart.init();
      await chart.setMainSeriesData(candles, docsInterval);
      chart.setMainDrawMode("OHLC");
      activeToolIdsRef.current = definitions[presetRef.current].draw(chart);
      chart.setMainDrawMode("OHLC");
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
        <span style={styles.metaChip}>{activePreset.runtimeType}</span>
        <span style={styles.metaChip}>{docsCandleCount} candles</span>
        <span style={styles.metaChip}>BTC/USD fixture</span>
      </div>

      <div ref={containerRef} style={styles.chartSurface} />
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
  metaChip: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(92, 200, 255, 0.12)",
    border: "1px solid rgba(92, 200, 255, 0.2)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  chartSurface: {
    minHeight: 420,
    height: 420,
    width: "100%",
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid var(--doc-border)",
    background: "#050505",
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
  },
};