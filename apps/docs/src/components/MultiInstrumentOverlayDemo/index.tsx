import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  applyDocsChartPreset,
  alignDocsChartViewport,
  docsChartEmbedBackground,
  getDocsChartCreateOptions,
} from "../docsChartTheme";
import { setupCompareChart } from "../MarketNewsApp/compareChartSetup";
import { getMarketNewsChartTheme } from "../MarketNewsApp/marketNewsTheme";

export default function MultiInstrumentOverlayDemo({ height = 420 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    const mount = async () => {
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
        applyDocsChartPreset(chart);
        await setupCompareChart(chart, "1m", getMarketNewsChartTheme("dark"));
        await alignDocsChartViewport(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Could not load the chart preview");
          setLoading(false);
        }
      }
    };

    void mount();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <figure style={styles.figure}>
      <DocChartEmbed
        minHeight={height}
        height={height}
        background={docsChartEmbedBackground}
        loading={loading}
        error={error}
      >
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>
      <figcaption style={styles.caption}>
        EUR/USD and GBP/USD on bundled H1 fixtures — both indexed to 100 at the window start and
        plotted on a shared percentage axis.
      </figcaption>
    </figure>
  );
}

const styles: Record<string, CSSProperties> = {
  figure: {
    margin: "24px 0",
  },
  caption: {
    marginTop: 12,
    fontSize: 14,
    color: "var(--doc-text-secondary)",
    textAlign: "center",
  },
};
