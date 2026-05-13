import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Candle, ChartInstance, DrawMode, Interval } from "@efixdata/exeria-chart";

type DatasetKey = "trend" | "range";

interface ExampleDataset {
  label: string;
  candles: Candle[];
}

const interval: Interval = {
  symbol: "1h",
  milis: 60 * 60 * 1000,
};

const drawModes: DrawMode[] = ["OHLC", "Line", "Histogram"];

const datasets: Record<DatasetKey, ExampleDataset> = {
  trend: {
    label: "Trend continuation",
    candles: [
      { stamp: 1715472000000, o: 101.2, h: 103.1, l: 100.9, c: 102.8, v: 3200 },
      { stamp: 1715475600000, o: 102.8, h: 104.2, l: 102.1, c: 103.9, v: 2950 },
      { stamp: 1715479200000, o: 103.9, h: 105.5, l: 103.2, c: 105.1, v: 3325 },
      { stamp: 1715482800000, o: 105.1, h: 106.2, l: 104.3, c: 104.8, v: 2875 },
      { stamp: 1715486400000, o: 104.8, h: 107.1, l: 104.5, c: 106.9, v: 3640 },
      { stamp: 1715490000000, o: 106.9, h: 108.3, l: 106.2, c: 107.6, v: 3900 },
    ],
  },
  range: {
    label: "Range compression",
    candles: [
      { stamp: 1715472000000, o: 95.1, h: 96.2, l: 94.5, c: 95.4, v: 1800 },
      { stamp: 1715475600000, o: 95.4, h: 96.1, l: 94.9, c: 95.7, v: 1720 },
      { stamp: 1715479200000, o: 95.7, h: 96.4, l: 95.2, c: 95.8, v: 1610 },
      { stamp: 1715482800000, o: 95.8, h: 96.0, l: 95.1, c: 95.3, v: 1685 },
      { stamp: 1715486400000, o: 95.3, h: 95.9, l: 94.8, c: 95.6, v: 1590 },
      { stamp: 1715490000000, o: 95.6, h: 96.3, l: 95.2, c: 95.9, v: 1660 },
    ],
  },
};

export default function ChartQuickstartExample() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const chartStateRef = useRef<{ datasetKey: DatasetKey; drawMode: DrawMode }>({
    datasetKey: "trend",
    drawMode: "OHLC",
  });
  const [datasetKey, setDatasetKey] = useState<DatasetKey>("trend");
  const [drawMode, setDrawMode] = useState<DrawMode>("OHLC");

  const activeDataset = useMemo(() => datasets[datasetKey], [datasetKey]);

  useEffect(() => {
    chartStateRef.current = { datasetKey, drawMode };
  }, [datasetKey, drawMode]);

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

      const chart = new chartModule.default({ container }) as unknown as ChartInstance;
      const initialState = chartStateRef.current;
      chartRef.current = chart;

      chart.init();
      await chart.setMainSeriesData(datasets[initialState.datasetKey].candles, interval);
      chart.setMainDrawMode(initialState.drawMode);
    };

    void mountChart();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) {
      return;
    }

    void chart.setMainSeriesData(activeDataset.candles, interval);
    chart.setMainDrawMode(drawMode);
  }, [activeDataset, drawMode]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <div>
          <span style={styles.controlLabel}>Dataset</span>
          <div style={styles.buttonRow}>
            {(Object.entries(datasets) as [DatasetKey, ExampleDataset][]).map(([key, dataset]) => (
              <button
                key={key}
                type="button"
                onClick={() => setDatasetKey(key)}
                style={key === datasetKey ? styles.activeButton : styles.button}
              >
                {dataset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={styles.controlLabel}>Draw mode</span>
          <div style={styles.buttonRow}>
            {drawModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDrawMode(mode)}
                style={mode === drawMode ? styles.activeButton : styles.button}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.metaRow}>
        <span style={styles.metaTag}>Public API only</span>
        <span style={styles.metaText}>createChart • init • setMainSeriesData • setMainDrawMode</span>
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