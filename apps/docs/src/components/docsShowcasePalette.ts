import { themePresets } from "./themeCreator/chartSettingsThemePresets";

const tradingDark = themePresets.find((preset) => preset.id === "trading-dark");
const chart = tradingDark?.chart.dark;

/** Runtime hex palette for docs chart demos — aligned with the Trading Dark preset. */
export const docsShowcasePalette = {
  background: chart?.background ?? "#0B0C10",
  accent: chart?.accent ?? "#00C8C8",
  tool: chart?.tool ?? "#78909C",
  success: chart?.candleUp ?? "#00C8C8",
  danger: chart?.candleDown ?? "#DC0464",
  crosshair: chart?.crosshair ?? "#00C8C8",
  warning: "#F0B429",
  violet: "#C084FC",
  violetSoft: "#A78BFA",
  orange: "#F97316",
  label: "#F7FBFF",
  positionWin: "#25AD98",
  positionLoss: "#D12E59",
} as const;
