import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import type { FintechThemeVariant } from "./fintechCompareChartSetup";

const SHELL_TOKENS: Record<
  FintechThemeVariant,
  Record<string, string>
> = {
  dark: {
    "--fintech-bg": "#000000",
    "--fintech-surface": "#0b0d12",
    "--fintech-border": "#1a1f2b",
    "--fintech-text": "#f5f7fb",
    "--fintech-muted": "#8b93a7",
    "--fintech-positive": "#7ce7a5",
    "--fintech-negative": "#ff6b8a",
  },
  light: {
    "--fintech-bg": "#f0f3fa",
    "--fintech-surface": "#ffffff",
    "--fintech-border": "#e0e3eb",
    "--fintech-text": "#131722",
    "--fintech-muted": "#787b86",
    "--fintech-positive": "#089981",
    "--fintech-negative": "#f23645",
  },
};

function getChartPresetId(themeVariant: FintechThemeVariant) {
  return themeVariant === "light" ? "day" : "trading-dark";
}

export function buildFintechThemeExport(themeVariant: FintechThemeVariant) {
  const chartPresetId = getChartPresetId(themeVariant);
  const preset = themePresets.find((entry) => entry.id === chartPresetId)!;

  return {
    themeVariant,
    chartPresetId,
    createChart: {
      theme: buildChartTheme(preset.chart),
      themeVariant,
    },
    shellCssVariables: SHELL_TOKENS[themeVariant],
    usage:
      "Pass createChart.theme and createChart.themeVariant into createChart(). Map shellCssVariables onto your app shell root.",
  };
}

export function formatFintechThemeExport(themeVariant: FintechThemeVariant): string {
  return JSON.stringify(buildFintechThemeExport(themeVariant), null, 2);
}
