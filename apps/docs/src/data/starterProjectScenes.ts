import type { ChartInstance } from "@efixdata/exeria-chart";
import { CHART_SETTINGS_PRESETS } from "../../../../packages/react-chart-ui/src/components/TopMenu/ChartSettings/chartSettingsPresets";
import { docsExampleDatasets } from "../components/chartExampleData";
import {
  drawPreviewOverlays,
  previewInstrument,
  type ThemeVariant,
} from "../components/themeCreator/core";
import { themePresets } from "../components/themeCreator/chartSettingsThemePresets";
import type { StarterProject } from "./starterProjects";

export type StarterProjectScene = {
  presetId: string;
  themeVariant: ThemeVariant;
  candles: typeof docsExampleDatasets.trend.candles;
  settingsPresetId?: string;
  applyScene?: (chart: ChartInstance, candles: StarterProjectScene["candles"]) => void | Promise<void>;
};

function getPreset(presetId: string) {
  return themePresets.find((preset) => preset.id === presetId) ?? themePresets[0]!;
}

export function getStarterProjectScene(projectId: StarterProject["id"]): StarterProjectScene {
  const trendCandles = docsExampleDatasets.trend.candles;
  const recentCandles = trendCandles.slice(-280);

  switch (projectId) {
    case "crypto-terminal":
      return {
        presetId: "trading-dark",
        themeVariant: "dark",
        candles: recentCandles,
        settingsPresetId: "trading-dark",
        applyScene: async (chart, candles) => {
          const template =
            CHART_SETTINGS_PRESETS.find((preset) => preset.id === "trading-dark")?.template ?? null;
          if (template) {
            chart.importChartSettingsTemplate(template);
          }

          chart.setMainDrawMode("OHLC");

          const ema = structuredClone(chart.getScripts().EMA);
          ema.inputs.PERIODS.value = 21;
          chart.addScript("EMA", ema);
          chart.addScript("RSI");
          drawPreviewOverlays(chart, candles);
        },
      };
    case "forex-platforms":
      return {
        presetId: "carbon",
        themeVariant: "dark",
        candles: recentCandles,
        settingsPresetId: "carbon",
        applyScene: async (chart, candles) => {
          chart.setMainDrawMode("OHLC");
          chart.addScript("EMA");
          drawPreviewOverlays(chart, candles);
          chart.toolDrawer.drawTool({
            type: "fibonLines",
            color: "#5cc8ff",
            anchors: [
              {
                stamp: candles[Math.floor(candles.length * 0.25)].stamp,
                offset: 0,
                value: candles[Math.floor(candles.length * 0.25)].h,
                _index: 0,
              },
              {
                stamp: candles[Math.floor(candles.length * 0.55)].stamp,
                offset: 0,
                value: candles[Math.floor(candles.length * 0.55)].l,
                _index: 0,
              },
            ],
          });
        },
      };
    case "fintech-integration":
      return {
        presetId: "day",
        themeVariant: "light",
        candles: trendCandles.slice(-160),
        applyScene: async (chart) => {
          chart.setMainDrawMode("Line");
        },
      };
    case "quant-analytics":
      return {
        presetId: "midnight",
        themeVariant: "dark",
        candles: recentCandles,
        applyScene: async (chart) => {
          chart.addScript("RSI");
          chart.addScript("MACD");
          // CROSS defaults wire to MACDLine / MACDSignal — MACD must exist first.
          chart.addScript("CROSS");
        },
      };
    case "market-news":
      return {
        presetId: "onyx",
        themeVariant: "light",
        candles: trendCandles.slice(-120),
        applyScene: async (chart) => {
          chart.setMainDrawMode("Line");
          const ema = structuredClone(chart.getScripts().EMA);
          ema.inputs.PERIODS.value = 50;
          chart.addScript("EMA", ema);
        },
      };
    case "screener-signals":
      return {
        presetId: "trading-dark",
        themeVariant: "dark",
        candles: recentCandles,
        applyScene: async (chart) => {
          // Strategy defaults resolve series fields from indicators already on the chart.
          chart.addScript("MACD");
          chart.addScript("CROSS");
          chart.addScript("BBAND");
          chart.addScript("EXCEED");
          chart.addScript("RSI");
        },
      };
    default:
      return {
        presetId: "trading-dark",
        themeVariant: "dark",
        candles: recentCandles,
      };
  }
}

export function getStarterProjectRuntimeTheme(projectId: StarterProject["id"]) {
  const scene = getStarterProjectScene(projectId);
  const preset = getPreset(scene.presetId);
  return {
    scene,
    preset,
    instrument: previewInstrument,
  };
}
