import type { ChartInstance } from "@efixdata/exeria-chart";
import type { ChartUITheme } from "../../../../../packages/react-chart-ui/src/chartTypes";
import {
  CHART_SETTINGS_PRESETS,
  DEFAULT_CHART_UI_THEME,
  type ChartSettingsPreset,
} from "../../../../../packages/react-chart-ui/src/components/TopMenu/ChartSettings/chartSettingsPresets";
import { mergeChartUiTheme } from "../../../../../packages/react-chart-ui/src/utils/mergeChartUiTheme";

export function getChartSettingsPreset(presetId: string): ChartSettingsPreset | undefined {
  return CHART_SETTINGS_PRESETS.find((entry) => entry.id === presetId);
}

/** Applies chart runtime + appearance exactly like Chart Settings preset picker. */
export function applyChartSettingsPreset(chart: ChartInstance, presetId: string): boolean {
  const preset = getChartSettingsPreset(presetId);
  if (!preset || !chart.importChartSettingsTemplate) {
    return false;
  }

  chart.importChartSettingsTemplate(preset.template);
  return true;
}

/** Builds the full React UI theme exactly like Chart Settings preset picker. */
export function buildChartSettingsPresetUiTheme(presetId: string): ChartUITheme | null {
  const preset = getChartSettingsPreset(presetId);
  if (!preset) {
    return null;
  }

  return mergeChartUiTheme(DEFAULT_CHART_UI_THEME, preset.uiTheme) as ChartUITheme;
}
