import type { ChartAppearanceSettings, ChartSettingsTemplate } from "@efixdata/exeria-chart";
import type { ChartUITheme } from "../../../chartTypes";

export interface ChartSettingsPreset {
  id: string;
  label: string;
  description: string;
  swatches: {
    background: string;
    up: string;
    down: string;
    grid: string;
    chrome: string;
  };
  template: ChartSettingsTemplate;
  uiTheme: Partial<ChartUITheme>;
}

const baseAppearance = (
  patch: Partial<ChartAppearanceSettings>,
): ChartAppearanceSettings => ({
  backgroundColor: "#131722",
  gridColor: "#2A2E39",
  chartLineColor: "#2962FF",
  chartFillColor: "#2962FF",
  candleUpColor: "#26A69A",
  candleDownColor: "#EF5350",
  candleUpStrokeColor: "#26A69A",
  candleDownStrokeColor: "#EF5350",
  axisTextColor: "#D1D4DC",
  axisBackgroundColor: "#131722",
  crosshairColor: "#2962FF",
  gridMode: "both",
  gridVisible: true,
  gridLineStyle: "solid",
  lastPriceLineVisible: true,
  lastPriceLabelVisible: true,
  chartLineFillVisible: false,
  ...patch,
});

const buildUiTheme = (options: {
  mode: "light" | "dark";
  surround: string;
  toolbar: string;
  panel: string;
  accent: string;
  text?: string;
  muted?: string;
}): Partial<ChartUITheme> => {
  const isLight = options.mode === "light";
  const text = options.text ?? (isLight ? "#131722" : "#D1D4DC");
  const muted = options.muted ?? (isLight ? "#787B86" : "rgba(255, 255, 255, 0.65)");
  const hoverBackground = isLight ? "rgba(19, 23, 34, 0.08)" : "rgba(255, 255, 255, 0.1)";
  const activeBackground = isLight ? "rgba(41, 98, 255, 0.14)" : "rgba(41, 98, 255, 0.22)";
  const inputBackground = isLight ? "#F0F3FA" : options.panel;
  const divider = isLight ? "rgba(19, 23, 34, 0.12)" : "rgba(255, 255, 255, 0.1)";

  const buttonColors = {
    color: muted,
    activeColor: text,
    hoverColor: text,
    hoverBackground,
    activeBackground,
  };

  return {
    surroundBackground: options.surround,
    accentColor: options.accent,
    border: {
      inner: `1px solid ${divider}`,
      outter: `1px solid ${divider}`,
    },
    buttons: buttonColors,
    radioButton: {
      background: isLight ? "rgba(19, 23, 34, 0.06)" : "rgba(127, 157, 204, 0.15)",
      buttons: buttonColors,
    },
    toolbar: {
      background: options.toolbar,
      buttons: buttonColors,
    },
    subMenu: {
      background: options.panel,
      buttons: buttonColors,
    },
    splitButton: {
      openBackground: options.panel,
      hoverBackground: options.panel,
      openColor: text,
      hoverColor: text,
      arrowHoverBackground: hoverBackground,
      arrowColor: options.accent,
      arrowOpenColor: options.accent,
    },
    dialog: {
      backgroundColor: options.panel,
      titleColor: text,
      textColor: text,
      dividerColor: divider,
      itemTitleColor: text,
      itemSubTitleColor: muted,
      itemHoverBackgroundColor: hoverBackground,
    },
    inputs: {
      backgroundColor: inputBackground,
      textColor: text,
      labelColor: text,
      placeholderColor: muted,
    },
    scrollBar: {
      trackColor: hoverBackground,
      thumbColor: isLight ? "rgba(19, 23, 34, 0.2)" : "rgba(255, 255, 255, 0.2)",
      thumbHoverColor: isLight ? "rgba(19, 23, 34, 0.35)" : "rgba(255, 255, 255, 0.35)",
    },
  };
};

const makePreset = (
  id: string,
  label: string,
  description: string,
  appearance: ChartAppearanceSettings,
  ui: {
    mode: "light" | "dark";
    surround: string;
    toolbar: string;
    panel: string;
    accent: string;
    text?: string;
    muted?: string;
  },
): ChartSettingsPreset => {
  const uiTheme = buildUiTheme(ui);

  return {
    id,
    label,
    description,
    swatches: {
      background: appearance.backgroundColor,
      up: appearance.candleUpColor,
      down: appearance.candleDownColor,
      grid: appearance.gridColor,
      chrome: ui.surround,
    },
    template: {
      version: 1,
      name: label,
      appearance: {
        ...appearance,
        axisBackgroundColor: ui.surround,
      },
      volume: null,
    },
    uiTheme,
  };
};

/**
 * Six presets modeled after the most common themes in TradingView, Thinkorswim, and MetaTrader.
 * Four dark + two light.
 */
export const CHART_SETTINGS_PRESETS: ChartSettingsPreset[] = [
  makePreset(
    "trading-dark",
    "Trading Dark",
    "TradingView default dark",
    baseAppearance({
      backgroundColor: "#131722",
      gridColor: "#2A2E39",
      axisTextColor: "#D1D4DC",
      axisBackgroundColor: "#131722",
      chartLineColor: "#2962FF",
      chartFillColor: "rgba(41, 98, 255, 0.25)",
      chartLineFillVisible: true,
      crosshairColor: "#2962FF",
    }),
    {
      mode: "dark",
      surround: "#1E222D",
      toolbar: "#1E222D",
      panel: "#2A2E39",
      accent: "#2962FF",
    },
  ),
  makePreset(
    "midnight",
    "Midnight",
    "TradingView Midnight blue",
    baseAppearance({
      backgroundColor: "#0C1220",
      gridColor: "#1A2332",
      axisTextColor: "#A3B1C6",
      axisBackgroundColor: "#0C1220",
      chartLineColor: "#5B8CFF",
      chartFillColor: "rgba(91, 140, 255, 0.22)",
      chartLineFillVisible: true,
      candleUpColor: "#34D399",
      candleDownColor: "#F87171",
      crosshairColor: "#5B8CFF",
    }),
    {
      mode: "dark",
      surround: "#090E18",
      toolbar: "#090E18",
      panel: "#151D2E",
      accent: "#5B8CFF",
    },
  ),
  makePreset(
    "carbon",
    "Carbon",
    "Neutral gray (Thinkorswim-style)",
    baseAppearance({
      backgroundColor: "#1C1C1C",
      gridColor: "#323232",
      axisTextColor: "#C7C7C7",
      axisBackgroundColor: "#1C1C1C",
      chartLineColor: "#4DA3FF",
      chartFillColor: "rgba(77, 163, 255, 0.2)",
      chartLineFillVisible: true,
      candleUpColor: "#4CAF50",
      candleDownColor: "#E53935",
      crosshairColor: "#4DA3FF",
    }),
    {
      mode: "dark",
      surround: "#141414",
      toolbar: "#141414",
      panel: "#262626",
      accent: "#4DA3FF",
    },
  ),
  makePreset(
    "onyx",
    "Onyx",
    "Pure black (MetaTrader classic)",
    baseAppearance({
      backgroundColor: "#000000",
      gridColor: "#1F1F1F",
      axisTextColor: "#BDBDBD",
      axisBackgroundColor: "#000000",
      chartLineColor: "#FFD54F",
      chartFillColor: "rgba(255, 213, 79, 0.18)",
      chartLineFillVisible: true,
      candleUpColor: "#00E676",
      candleDownColor: "#FF5252",
      crosshairColor: "#FFD54F",
      gridLineStyle: "dashed",
    }),
    {
      mode: "dark",
      surround: "#0A0A0A",
      toolbar: "#0A0A0A",
      panel: "#141414",
      accent: "#FFD54F",
    },
  ),
  makePreset(
    "day",
    "Day",
    "TradingView light",
    baseAppearance({
      backgroundColor: "#FFFFFF",
      gridColor: "#E0E3EB",
      axisTextColor: "#131722",
      axisBackgroundColor: "#F0F3FA",
      chartLineColor: "#2962FF",
      chartFillColor: "rgba(41, 98, 255, 0.12)",
      chartLineFillVisible: true,
      candleUpColor: "#089981",
      candleDownColor: "#F23645",
      candleUpStrokeColor: "#089981",
      candleDownStrokeColor: "#F23645",
      crosshairColor: "#2962FF",
    }),
    {
      mode: "light",
      surround: "#F0F3FA",
      toolbar: "#F0F3FA",
      panel: "#FFFFFF",
      accent: "#2962FF",
      text: "#131722",
      muted: "#787B86",
    },
  ),
  makePreset(
    "paper",
    "Paper",
    "Bright office / high contrast",
    baseAppearance({
      backgroundColor: "#FAFBFC",
      gridColor: "#E5E7EB",
      axisTextColor: "#111827",
      axisBackgroundColor: "#F3F4F6",
      chartLineColor: "#2563EB",
      chartFillColor: "rgba(37, 99, 235, 0.1)",
      chartLineFillVisible: true,
      candleUpColor: "#16A34A",
      candleDownColor: "#DC2626",
      crosshairColor: "#2563EB",
    }),
    {
      mode: "light",
      surround: "#EEF0F3",
      toolbar: "#EEF0F3",
      panel: "#FFFFFF",
      accent: "#2563EB",
      text: "#111827",
      muted: "#6B7280",
    },
  ),
];
