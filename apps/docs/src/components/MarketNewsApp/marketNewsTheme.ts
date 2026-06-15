import type { ThemeVariant } from "../themeCreator/core";

export type MarketNewsLayoutTheme = "light" | "dark";

export type MarketNewsChartTheme = {
  presetId: string;
  variant: ThemeVariant;
  newsLineColor: string;
  comparePrimary: string;
  compareOverlay: string;
  miniChartPresetId: string;
};

/** Light = chart preset "onyx" (editorial article default). Dark = "carbon" terminal look. */
export const MARKET_NEWS_CHART_THEMES: Record<MarketNewsLayoutTheme, MarketNewsChartTheme> = {
  light: {
    presetId: "onyx",
    variant: "light",
    newsLineColor: "#2563eb",
    comparePrimary: "#2563eb",
    compareOverlay: "#d97706",
    miniChartPresetId: "onyx",
  },
  dark: {
    presetId: "carbon",
    variant: "dark",
    newsLineColor: "#6d93ff",
    comparePrimary: "#2962ff",
    compareOverlay: "#f59e0b",
    miniChartPresetId: "carbon",
  },
};

export function getMarketNewsChartTheme(layout: MarketNewsLayoutTheme): MarketNewsChartTheme {
  return MARKET_NEWS_CHART_THEMES[layout];
}
