import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { ChartInstance } from "@exeria/charts";
import {
  docsExampleDatasets,
  docsInterval,
  drawingShowcaseCandles,
  getCandleAtRatio,
} from "../chartExampleData";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";

export type TutorialScene = "basic" | "indicators" | "live-stream" | "custom-theme";

type TutorialChartDemoProps = {
  scene: TutorialScene;
  /** Short line shown under the chart */
  caption?: string;
  height?: number;
};

const themePresets: Record<
  TutorialScene,
  { theme?: Record<string, string>; themeVariant?: "dark" | "light" } | undefined
> = {
  basic: undefined,
  indicators: undefined,
  "live-stream": undefined,
  "custom-theme": {
    themeVariant: "dark",
    theme: {
      background: "#0f1419",
      grid: "#1e2a3a",
      candleUp: "#3dd68c",
      candleDown: "#f97066",
    },
  },
};

async function applyScene(chart: ChartInstance, scene: TutorialScene) {
  const candles = docsExampleDatasets.trend.candles;

  if (scene === "indicators") {
    chart.addScript("EMA");
    chart.addScript("RSI");
    return;
  }

  if (scene === "live-stream") {
    const last = candles.at(-1);
    if (!last) {
      return;
    }

    let price = last.c;
    let stamp = last.stamp;

    const interval = window.setInterval(() => {
      const delta = (Math.random() - 0.48) * 80;
      price = Math.max(price + delta, 1000);
      stamp += 60_000;

      chart.appendTick(
        {
          stamp,
          price,
          v: Math.round(40 + Math.random() * 120),
        },
        false,
      );
    }, 900);

    (chart as ChartInstance & { __tutorialLiveTimer?: number }).__tutorialLiveTimer = interval;
    return;
  }

  if (scene === "custom-theme") {
    return;
  }

  if (scene === "basic") {
    chart.setMainDrawMode("OHLC");
  }
}

function clearLiveTimer(chart: ChartInstance | null) {
  if (!chart) {
    return;
  }

  const extended = chart as ChartInstance & { __tutorialLiveTimer?: number };
  if (extended.__tutorialLiveTimer) {
    window.clearInterval(extended.__tutorialLiveTimer);
    delete extended.__tutorialLiveTimer;
  }
}

export default function TutorialChartDemo({ scene, caption, height = 380 }: TutorialChartDemoProps) {
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
        const chartModule = await import("@exeria/charts");
        if (disposed) {
          return;
        }

        const preset = themePresets[scene];
        const chart = chartModule.createChart({
          container,
          ...(preset?.theme ? { theme: preset.theme, themeVariant: preset.themeVariant } : {}),
        });

        chartRef.current = chart;
        chart.init();
        await chart.setMainSeriesData(docsExampleDatasets.trend.candles, docsInterval);
        await applyScene(chart, scene);

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
      clearLiveTimer(chartRef.current);
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [scene]);

  return (
    <figure style={styles.figure}>
      <DocChartEmbed minHeight={height} height={height} loading={loading} error={error}>
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>
      {caption ? <figcaption style={styles.caption}>{caption}</figcaption> : null}
    </figure>
  );
}

/** Trend line + support level on sample BTC data — used in the drawing tools tutorial. */
export function TutorialDrawingDemo({ height = 380 }: { height?: number }) {
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
        const chartModule = await import("@exeria/charts");
        if (disposed) {
          return;
        }

        const chart = chartModule.createChart({ container });
        chartRef.current = chart;
        chart.init();
        await chart.setMainSeriesData(drawingShowcaseCandles, docsInterval);

        const start = getCandleAtRatio(drawingShowcaseCandles, 0.2);
        const end = getCandleAtRatio(drawingShowcaseCandles, 0.65);
        const support = getCandleAtRatio(drawingShowcaseCandles, 0.85);

        chart.toolDrawer.drawTrendLine({
          startStamp: start.stamp,
          endStamp: end.stamp,
          startPrice: start.l,
          endPrice: end.h,
          config: { color: "#5cc8ff" },
        });

        chart.toolDrawer.drawTool({
          type: "hLine",
          color: "#14f7ab",
          priceTag: true,
          anchors: [{ stamp: support.stamp, offset: 0, value: support.l, _index: 0 }],
        });

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
      <DocChartEmbed minHeight={height} height={height} loading={loading} error={error}>
        <div ref={containerRef} className={docChartEmbedStyles.canvas} />
      </DocChartEmbed>
      <figcaption style={styles.caption}>
        Blue trend line and green horizontal support level — drawn with two short code snippets.
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
