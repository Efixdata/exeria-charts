import { useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { CHART_SETTINGS_PRESETS } from "../../../../../packages/react-chart-ui/src/components/TopMenu/ChartSettings/chartSettingsPresets";
import DocChartEmbed, { docChartEmbedStyles } from "../DocChartEmbed";
import { docsShowcasePalette } from "../docsShowcasePalette";
import { docsExampleDatasets, docsInterval } from "../chartExampleData";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import {
  buildChartTheme,
  drawPreviewOverlays,
  previewInstrument,
} from "../themeCreator/core";

const tradingDarkPreset = themePresets.find((preset) => preset.id === "trading-dark")!;
const tradingDarkTemplate =
  CHART_SETTINGS_PRESETS.find((preset) => preset.id === "trading-dark")?.template ?? null;

const cryptoTerminalCandles = docsExampleDatasets.trend.candles.slice(-280);

async function setupCryptoTerminalChart(chart: ChartInstance) {
  if (tradingDarkTemplate) {
    chart.importChartSettingsTemplate(tradingDarkTemplate);
  }

  chart.setMainDrawMode("OHLC");

  const ema = JSON.parse(JSON.stringify(chart.getScripts().EMA));
  ema.inputs.PERIODS.value = 21;
  chart.addScript("EMA", ema);

  chart.addScript("RSI");

  drawPreviewOverlays(chart, cryptoTerminalCandles);
}

export default function CryptoTerminalCaseStudyChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runtimeTheme = useMemo(() => buildChartTheme(tradingDarkPreset.chart), []);

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
          instrument: previewInstrument,
          theme: runtimeTheme,
          themeVariant: "dark",
        });

        chartRef.current = chart;
        chart.init();
        await chart.setMainSeriesData(cryptoTerminalCandles, docsInterval);
        await setupCryptoTerminalChart(chart);

        if (!disposed) {
          setLoading(false);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load case study chart");
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
  }, [runtimeTheme]);

  return (
    <DocChartEmbed nested background={docsShowcasePalette.background} loading={loading} error={error}>
      <div ref={containerRef} className={docChartEmbedStyles.canvas} />
    </DocChartEmbed>
  );
}
