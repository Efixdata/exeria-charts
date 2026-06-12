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
  chartLineFillMode: "solid",
  chartFillGradientColor: "#2962FF",
  chartFillGradientOpacity: 0.4,
  ...patch,
});

function accentFill(accent: string, alpha: number): string {
  const normalized = accent.replace("#", "");
  if (normalized.length !== 6) {
    return `rgba(41, 98, 255, ${alpha})`;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const buildChartUiTheme = (options: {
  mode: "light" | "dark";
  surround: string;
  toolbar: string;
  dialog: string;
  input: string;
  accent: string;
  uiAccent?: string;
  text?: string;
  muted?: string;
  inputBorder?: string;
  activeButtonBackground?: string;
  activeButtonColor?: string;
  dividerColor?: string;
  hoverBackground?: string;
  radioButtonBackground?: string;
  scrollBarThumbColor?: string;
  scrollBarThumbHoverColor?: string;
}): Partial<ChartUITheme> => {
  const isLight = options.mode === "light";
  const text = options.text ?? (isLight ? "#131722" : "#D1D4DC");
  const muted = options.muted ?? (isLight ? "#787B86" : "#848E9C");
  const divider =
    options.dividerColor ?? (isLight ? "rgba(19, 23, 34, 0.12)" : "rgba(255, 255, 255, 0.12)");
  const inputBorder =
    options.inputBorder ?? (isLight ? "1px solid #E0E3EB" : "1px solid rgba(255, 255, 255, 0.14)");
  const hoverBackground =
    options.hoverBackground ?? (isLight ? "rgba(19, 23, 34, 0.06)" : "rgba(255, 255, 255, 0.08)");
  const radioButtonBackground =
    options.radioButtonBackground ??
    (isLight ? "rgba(19, 23, 34, 0.05)" : "rgba(255, 255, 255, 0.06)");
  const scrollBarThumbColor =
    options.scrollBarThumbColor ??
    (isLight ? "rgba(19, 23, 34, 0.18)" : "rgba(255, 255, 255, 0.22)");
  const scrollBarThumbHoverColor =
    options.scrollBarThumbHoverColor ??
    (isLight ? "rgba(19, 23, 34, 0.32)" : "rgba(255, 255, 255, 0.34)");
  const chromeAccent = options.uiAccent ?? options.accent;
  const activeBackground =
    options.activeButtonBackground ?? (isLight ? accentFill(chromeAccent, 0.14) : options.input);
  const activeColor = options.activeButtonColor ?? (isLight ? chromeAccent : "#FFFFFF");

  const buttonColors = {
    color: muted,
    activeColor,
    hoverColor: text,
    hoverBackground: isLight ? hoverBackground : "rgba(255, 255, 255, 0.12)",
    activeBackground,
  };

  return {
    surroundBackground: options.surround,
    gap: 8,
    accentColor: chromeAccent,
    border: {
      inner: inputBorder,
      radius: 8,
    },
    buttons: buttonColors,
    radioButton: {
      background: radioButtonBackground,
      buttons: buttonColors,
    },
    toolbar: {
      background: options.toolbar,
      buttons: buttonColors,
      topMenuPosition: "right",
      showCurrency: false,
    },
    subMenu: {
      background: options.dialog,
      buttons: buttonColors,
    },
    splitButton: {
      openBackground: options.dialog,
      hoverBackground: options.dialog,
      openColor: text,
      hoverColor: text,
      arrowHoverBackground: hoverBackground,
      arrowColor: muted,
      arrowOpenColor: text,
    },
    dialog: {
      backgroundColor: options.dialog,
      titleColor: text,
      textColor: text,
      dividerColor: divider,
      itemTitleColor: text,
      itemSubTitleColor: muted,
      itemHoverBackgroundColor: hoverBackground,
    },
    inputs: {
      backgroundColor: options.input,
      textColor: text,
      labelColor: text,
      placeholderColor: muted,
    },
    scrollBar: {
      trackColor: hoverBackground,
      thumbColor: scrollBarThumbColor,
      thumbHoverColor: scrollBarThumbHoverColor,
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
    dialog: string;
    input: string;
    accent: string;
    uiAccent?: string;
    text?: string;
    muted?: string;
    inputBorder?: string;
    activeButtonBackground?: string;
    activeButtonColor?: string;
    dividerColor?: string;
    hoverBackground?: string;
    radioButtonBackground?: string;
    scrollBarThumbColor?: string;
    scrollBarThumbHoverColor?: string;
  },
): ChartSettingsPreset => {
  const uiTheme = buildChartUiTheme(ui);

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
 * Six common chart theme presets. Three dark + three light.
 */
export const CHART_SETTINGS_PRESETS: ChartSettingsPreset[] = [
  makePreset(
    "trading-dark",
    "Trading Dark",
    "Default dark theme",
    baseAppearance({
      backgroundColor: "#0B0C10",
      gridColor: "#171E21",
      axisTextColor: "#CFD8DC",
      axisBackgroundColor: "#0B0C10",
      chartLineColor: "#00C8C8",
      chartFillColor: "rgba(0, 200, 200, 0.22)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#00C8C8",
      chartFillGradientOpacity: 0.48,
      candleUpColor: "#00C8C8",
      candleDownColor: "#DC0464",
      candleUpStrokeColor: "#00C8C8",
      candleDownStrokeColor: "#DC0464",
      crosshairColor: "#00C8C8",
    }),
    {
      mode: "dark",
      surround: "#101218",
      toolbar: "#101218",
      dialog: "#12141A",
      input: "#181B22",
      accent: "#00C8C8",
      text: "#CFD8DC",
      muted: "#546E7A",
      inputBorder: "1px solid #37474F",
      activeButtonBackground: "#0A5F5F",
      activeButtonColor: "#FFFFFF",
    },
  ),
  makePreset(
    "midnight",
    "Midnight",
    "Deep midnight blue",
    baseAppearance({
      backgroundColor: "#0C1220",
      gridColor: "#1A2332",
      axisTextColor: "#A3B1C6",
      axisBackgroundColor: "#0C1220",
      chartLineColor: "#5B8CFF",
      chartFillColor: "rgba(91, 140, 255, 0.22)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#5B8CFF",
      chartFillGradientOpacity: 0.42,
      candleUpColor: "#34D399",
      candleDownColor: "#F87171",
      candleUpStrokeColor: "#34D399",
      candleDownStrokeColor: "#F87171",
      crosshairColor: "#5B8CFF",
    }),
    {
      mode: "dark",
      surround: "#090E18",
      toolbar: "#090E18",
      dialog: "#0C1220",
      input: "#151D2E",
      accent: "#5B8CFF",
      text: "#A3B1C6",
      muted: "#6B7D94",
      inputBorder: "1px solid #243044",
      activeButtonBackground: "#243B6B",
      activeButtonColor: "#FFFFFF",
    },
  ),
  makePreset(
    "carbon",
    "Carbon",
    "Enterprise trading terminal",
    baseAppearance({
      backgroundColor: "#1E222D",
      gridColor: "#253558",
      axisTextColor: "#CBD5E1",
      axisBackgroundColor: "#1E222D",
      chartLineColor: "#D97706",
      chartFillColor: "rgba(217, 119, 6, 0.24)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#D97706",
      chartFillGradientOpacity: 0.38,
      candleUpColor: "#2E7D52",
      candleDownColor: "#B91C1C",
      candleUpStrokeColor: "#2E7D52",
      candleDownStrokeColor: "#B91C1C",
      crosshairColor: "#D97706",
      gridLineStyle: "solid",
    }),
    {
      mode: "dark",
      surround: "#1A1E28",
      toolbar: "#1A1E28",
      dialog: "#1E222D",
      input: "#262B36",
      accent: "#D97706",
      text: "#CBD5E1",
      muted: "#7B8A9A",
      inputBorder: "1px solid #334155",
      activeButtonBackground: "#1E3A8A",
      activeButtonColor: "#FFFFFF",
    },
  ),
  makePreset(
    "onyx",
    "Monochrome",
    "Pure black and white light theme",
    baseAppearance({
      backgroundColor: "#FFFFFF",
      gridColor: "#E8E8E8",
      axisTextColor: "#000000",
      axisBackgroundColor: "#FFFFFF",
      chartLineColor: "#000000",
      chartFillColor: "rgba(0, 0, 0, 0.08)",
      chartLineFillVisible: false,
      chartLineFillMode: "solid",
      chartFillGradientColor: "#000000",
      chartFillGradientOpacity: 0.12,
      candleUpColor: "#FFFFFF",
      candleDownColor: "#000000",
      candleUpStrokeColor: "#000000",
      candleDownStrokeColor: "#000000",
      crosshairColor: "#000000",
      gridLineStyle: "solid",
    }),
    {
      mode: "light",
      surround: "#FAFAFA",
      toolbar: "#FAFAFA",
      dialog: "#FFFFFF",
      input: "#F5F5F5",
      accent: "#000000",
      text: "#000000",
      muted: "#666666",
      inputBorder: "1px solid #E8E8E8",
      activeButtonBackground: "#000000",
      activeButtonColor: "#FFFFFF",
      dividerColor: "rgba(0, 0, 0, 0.12)",
      hoverBackground: "rgba(0, 0, 0, 0.06)",
      radioButtonBackground: "rgba(0, 0, 0, 0.05)",
      scrollBarThumbColor: "rgba(0, 0, 0, 0.18)",
      scrollBarThumbHoverColor: "rgba(0, 0, 0, 0.32)",
    },
  ),
  makePreset(
    "day",
    "Day",
    "Default light theme",
    baseAppearance({
      backgroundColor: "#FFFFFF",
      gridColor: "#E0E3EB",
      axisTextColor: "#131722",
      axisBackgroundColor: "#F0F3FA",
      chartLineColor: "#2962FF",
      chartFillColor: "rgba(41, 98, 255, 0.12)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#2962FF",
      chartFillGradientOpacity: 0.35,
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
      dialog: "#FFFFFF",
      input: "#FFFFFF",
      accent: "#2962FF",
      text: "#131722",
      muted: "#787B86",
      inputBorder: "1px solid #E0E3EB",
      activeButtonBackground: "#E0EAFF",
      activeButtonColor: "#2962FF",
    },
  ),
  makePreset(
    "paper",
    "Pearl",
    "Warm neutral light theme",
    baseAppearance({
      backgroundColor: "#FAFAF9",
      gridColor: "#E7E5E4",
      axisTextColor: "#292524",
      axisBackgroundColor: "#F5F4F1",
      chartLineColor: "#EA580C",
      chartFillColor: "rgba(234, 88, 12, 0.12)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#EA580C",
      chartFillGradientOpacity: 0.35,
      candleUpColor: "#16A34A",
      candleDownColor: "#DC2626",
      candleUpStrokeColor: "#16A34A",
      candleDownStrokeColor: "#DC2626",
      crosshairColor: "#EA580C",
    }),
    {
      mode: "light",
      surround: "#F5F4F1",
      toolbar: "#F5F4F1",
      dialog: "#FFFFFF",
      input: "#FFFFFF",
      accent: "#EA580C",
      text: "#292524",
      muted: "#78716C",
      inputBorder: "1px solid #E7E5E4",
      activeButtonBackground: "#FFEDD5",
      activeButtonColor: "#C2410C",
    },
  ),
];

export { buildChartUiTheme };

const tradingDarkPreset = CHART_SETTINGS_PRESETS.find((preset) => preset.id === "trading-dark")!;

export const DEFAULT_CHART_UI_THEME = tradingDarkPreset.uiTheme as ChartUITheme;
export const DEFAULT_CHART_SETTINGS_TEMPLATE = tradingDarkPreset.template;
