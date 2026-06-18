import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { docsExampleDatasets, docsInterval } from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import {
  applyDocsChartPreset,
  alignDocsChartViewport,
  docsChartEmbedBackground,
  docsChartUiTheme,
  getDocsChartCreateOptions,
} from "../docsChartTheme";
import { loadChartUI } from "@site/src/utils/loadChartUI";

type GettingStartedDemoProps = {
  /** `vanilla` = chart only; `react` = chart + toolbar (ChartUI) */
  variant?: "vanilla" | "react";
  height?: number;
  caption?: string;
};

export default function GettingStartedDemo({
  variant = "vanilla",
  height = 400,
  caption,
}: GettingStartedDemoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<{
    chart: ChartInstance | null;
    children: ReactNode;
  }> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (variant !== "react") {
      return;
    }

    let disposed = false;

    loadChartUI()
      .then((ChartUI) => {
        if (!disposed) {
          setChartUIComponent(() => ChartUI as ComponentType<{
            chart: ChartInstance | null;
            children: ReactNode;
          }>);
        }
      })
      .catch((nextError: unknown) => {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Could not load ChartUI");
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [variant]);

  useEffect(() => {
    let disposed = false;

    const mount = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      if (variant === "react" && !ChartUIComponent) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        const instance = chartModule.createChart({
          container,
          ...getDocsChartCreateOptions(),
        });
        chartRef.current = instance;
        instance.init();
        await instance.setMainSeriesData(docsExampleDatasets.trend.candles, docsInterval, false);
        applyDocsChartPreset(instance);
        instance.setMainDrawMode("OHLC");
        await alignDocsChartViewport(instance);

        if (!disposed) {
          setChart(instance);
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
      setChart(null);
    };
  }, [variant, ChartUIComponent]);

  const canvas = <div ref={containerRef} className={docChartEmbedStyles.canvas} />;
  const ChartUI = ChartUIComponent;

  return (
    <figure style={{ margin: "24px 0" }}>
      <DocChartEmbed
        minHeight={height}
        height={height}
        loading={loading}
        error={error}
        background={docsChartEmbedBackground}
        padded={variant === "react"}
      >
        {variant === "react" && ChartUI ? (
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
          <ChartUI chart={chart} theme={docsChartUiTheme ?? undefined}>
            {canvas}
          </ChartUI>
        ) : (
          canvas
        )}
      </DocChartEmbed>
      {caption ? (
        <figcaption
          style={{
            marginTop: 12,
            fontSize: 14,
            color: "var(--doc-text-secondary)",
            textAlign: "center",
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
