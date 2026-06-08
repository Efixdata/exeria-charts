import { themePresets } from "./themeCreator/chartSettingsThemePresets";

const tradingDark = themePresets.find((preset) => preset.id === "trading-dark");
const chart = tradingDark?.chart.dark;

/** Runtime hex palette for docs chart demos — aligned with the Trading Dark preset. */
export const docsShowcasePalette = {
  background: chart?.background ?? "#131722",
  accent: chart?.accent ?? "#2962FF",
  tool: chart?.tool ?? "#787B86",
  success: chart?.candleUp ?? "#26A69A",
  danger: chart?.candleDown ?? "#EF5350",
  crosshair: chart?.crosshair ?? "#2962FF",
  warning: "#F0B429",
  violet: "#C084FC",
  violetSoft: "#A78BFA",
  orange: "#F97316",
  label: "#F7FBFF",
  positionWin: "#25AD98",
  positionLoss: "#D12E59",
} as const;
