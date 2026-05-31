import type { ChartAppearanceSettings } from "@efixdata/exeria-chart";
import { resolveChartThemeVariant } from "@efixdata/exeria-chart";
import type { ChartUITheme } from "../chartTypes";
import { buildChartUiTheme } from "../components/TopMenu/ChartSettings/chartSettingsPresets";

/**
 * Maps chart appearance colors to toolbar / dialog chrome so manual color edits
 * stay in sync with the plot (same as preset templates).
 */
export function deriveChartUiThemeFromAppearance(
  settings: ChartAppearanceSettings,
): Partial<ChartUITheme> {
  const isLight = resolveChartThemeVariant(settings.backgroundColor) === "light";

  return buildChartUiTheme({
    mode: isLight ? "light" : "dark",
    surround: settings.axisBackgroundColor,
    toolbar: settings.axisBackgroundColor,
    dialog: isLight ? settings.backgroundColor : settings.axisBackgroundColor,
    input: isLight ? settings.axisBackgroundColor : settings.gridColor,
    accent: settings.chartLineColor,
    uiAccent: isLight ? settings.chartLineColor : settings.crosshairColor,
    text: settings.axisTextColor,
    muted: isLight ? "#787B86" : undefined,
    inputBorder: isLight ? `1px solid ${settings.gridColor}` : undefined,
  });
}
