import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance, DrawMode } from "@efixdata/exeria-chart";
import {
  docsCandleCount,
  docsExampleDatasets,
  docsInterval,
  type ExampleDataset,
  type ExampleDatasetKey,
} from "../chartExampleData";

const drawModes: DrawMode[] = ["OHLC", "Line", "Histogram"];

export default function ChartQuickstartExample() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const chartStateRef = useRef<{ datasetKey: ExampleDatasetKey; drawMode: DrawMode }>({
    datasetKey: "trend",
    drawMode: "OHLC",
  });
  const [datasetKey, setDatasetKey] = useState<ExampleDatasetKey>("trend");
  const [drawMode, setDrawMode] = useState<DrawMode>("OHLC");

  const activeDataset = useMemo(() => docsExampleDatasets[datasetKey], [datasetKey]);

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

      const chart = chartModule.createChart({ container });
      const initialState = chartStateRef.current;
      chartRef.current = chart;

      chart.init();
      await chart.setMainSeriesData(docsExampleDatasets[initialState.datasetKey].candles, docsInterval);
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

    void chart.setMainSeriesData(activeDataset.candles, docsInterval);
    chart.setMainDrawMode(drawMode);
  }, [activeDataset, drawMode]);

  return (
    <div style={styles.wrapper}>
      <div style={styles.controls}>
        <div>
          <span style={styles.controlLabel}>Dataset</span>
          <div style={styles.buttonRow}>
            {(Object.entries(docsExampleDatasets) as [ExampleDatasetKey, ExampleDataset][]).map(([key, dataset]) => (
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
        <span style={styles.metaChip}>{docsCandleCount} candles per dataset</span>
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