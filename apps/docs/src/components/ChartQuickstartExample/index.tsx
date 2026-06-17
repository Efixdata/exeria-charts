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
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  applyDocsChartPreset,
  alignDocsChartViewport,
  docsChartEmbedBackground,
  getDocsChartCreateOptions,
} from "../docsChartTheme";
import showcaseStyles from "../docsShowcase.module.css";

const drawModes: DrawMode[] = ["OHLC", "Line", "Histogram"];

type ChartQuickstartExampleProps = {
  compact?: boolean;
};

export default function ChartQuickstartExample({ compact = false }: ChartQuickstartExampleProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const chartStateRef = useRef<{ datasetKey: ExampleDatasetKey; drawMode: DrawMode }>({
    datasetKey: "trend",
    drawMode: "OHLC",
  });
  const [datasetKey, setDatasetKey] = useState<ExampleDatasetKey>("trend");
  const [drawMode, setDrawMode] = useState<DrawMode>("OHLC");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const initialState = chartStateRef.current;
        chartRef.current = chart;

        chart.init();
        await chart.setMainSeriesData(
          docsExampleDatasets[initialState.datasetKey].candles,
          docsInterval,
          false,
        );
        applyDocsChartPreset(chart);
        chart.setMainDrawMode(initialState.drawMode);
        await alignDocsChartViewport(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load chart example");
          setLoading(false);
        }
      }
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

    void (async () => {
      await chart.setMainSeriesData(activeDataset.candles, docsInterval, false);
      chart.setMainDrawMode(drawMode);
      await alignDocsChartViewport(chart);
    })();
  }, [activeDataset, drawMode]);

  return (
    <div style={compact ? styles.compactWrapper : styles.wrapper}>
      {!compact ? (
        <>
          <div style={styles.controls}>
            <div>
              <span style={styles.controlLabel}>Dataset</span>
              <div style={styles.buttonRow}>
                {(Object.entries(docsExampleDatasets) as [ExampleDatasetKey, ExampleDataset][]).map(
                  ([key, dataset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDatasetKey(key)}
                      style={key === datasetKey ? styles.activeButton : styles.button}
                    >
                      {dataset.label}
                    </button>
                  ),
                )}
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
            <span className={showcaseStyles.metaChip}>{docsCandleCount} candles per dataset</span>
          </div>
        </>
      ) : null}

      {compact ? (
        <DocChartEmbed nested background={docsChartEmbedBackground} loading={loading} error={error}>
          <div ref={containerRef} className={docChartEmbedStyles.canvas} />
        </DocChartEmbed>
      ) : (
        <DocChartEmbed
          minHeight={420}
          height={420}
          background={docsChartEmbedBackground}
          loading={loading}
          error={error}
        >
          <div ref={containerRef} className={docChartEmbedStyles.canvas} />
        </DocChartEmbed>
      )}
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
  compactWrapper: {
    width: "100%",
    height: "100%",
  },
};