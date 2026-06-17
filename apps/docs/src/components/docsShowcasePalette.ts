import { themePresets } from "./themeCreator/chartSettingsThemePresets";
import { DOCS_CHART_PRESET_ID } from "./docsChartTheme";

const carbonPreset = themePresets.find((preset) => preset.id === DOCS_CHART_PRESET_ID);
const chart = carbonPreset?.chart.dark;

/** Runtime hex palette for docs chart demos — aligned with the Carbon preset. */
export const docsShowcasePalette = {
  background: chart?.background ?? "#1E222D",
  accent: chart?.accent ?? "#D97706",
  tool: chart?.tool ?? "#D97706",
  success: chart?.candleUp ?? "#2E7D52",
  danger: chart?.candleDown ?? "#B91C1C",
  crosshair: chart?.crosshair ?? "#D97706",
  warning: "#F0B429",
  violet: "#C084FC",
  violetSoft: "#A78BFA",
  orange: "#F97316",
  label: "#CBD5E1",
  positionWin: "#2E7D52",
  positionLoss: "#B91C1C",
} as const;
