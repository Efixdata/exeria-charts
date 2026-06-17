import type { ChartInstance } from "@efixdata/exeria-chart";
import type { ChartUITheme } from "../../../../packages/react-chart-ui/src/chartTypes";
import {
  applyChartSettingsPreset,
  buildChartSettingsPresetUiTheme,
} from "./themeCreator/applyChartSettingsPreset";
import { buildChartTheme } from "./themeCreator/core";
import { themePresets } from "./themeCreator/chartSettingsThemePresets";

export const DOCS_CHART_PRESET_ID = "carbon" as const;

const docsChartPreset = themePresets.find((preset) => preset.id === DOCS_CHART_PRESET_ID)!;

export const docsChartRuntimeTheme = buildChartTheme(docsChartPreset.chart);
export const docsChartThemeVariant = docsChartPreset.preferredVariant ?? "dark";
export const docsChartUiTheme = buildChartSettingsPresetUiTheme(DOCS_CHART_PRESET_ID);
export const docsChartEmbedBackground = docsChartPreset.chart.dark.background;

export function getDocsChartCreateOptions() {
  return {
    theme: docsChartRuntimeTheme,
    themeVariant: docsChartThemeVariant,
  };
}

export function applyDocsChartPreset(chart: ChartInstance): void {
  applyChartSettingsPreset(chart, DOCS_CHART_PRESET_ID);
}

/** Re-fit after the embed container has layout dimensions (avoids empty/off-screen viewport). */
export async function alignDocsChartViewport(chart: ChartInstance): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
  chart.fit();
  chart.moveToEnd?.({ rerender: true });
}

export function getDocsChartUiTheme(): ChartUITheme | null {
  return docsChartUiTheme;
}
