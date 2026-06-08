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
}): Partial<ChartUITheme> => {
  const isLight = options.mode === "light";
  const text = options.text ?? (isLight ? "#131722" : "#D1D4DC");
  const muted = options.muted ?? (isLight ? "#787B86" : "#848E9C");
  const divider = isLight ? "rgba(19, 23, 34, 0.12)" : "rgba(255, 255, 255, 0.12)";
  const inputBorder =
    options.inputBorder ?? (isLight ? "1px solid #E0E3EB" : "1px solid rgba(255, 255, 255, 0.14)");
  const hoverBackground = isLight ? "rgba(19, 23, 34, 0.06)" : "rgba(255, 255, 255, 0.08)";
  const chromeAccent = options.uiAccent ?? options.accent;
  const activeBackground = isLight ? accentFill(chromeAccent, 0.14) : options.input;
  const activeColor = isLight ? chromeAccent : "#FFFFFF";

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
      background: isLight ? "rgba(19, 23, 34, 0.05)" : "rgba(255, 255, 255, 0.06)",
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
      thumbColor: isLight ? "rgba(19, 23, 34, 0.18)" : "rgba(255, 255, 255, 0.22)",
      thumbHoverColor: isLight ? "rgba(19, 23, 34, 0.32)" : "rgba(255, 255, 255, 0.34)",
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
 * Six common chart theme presets. Four dark + two light.
 */
export const CHART_SETTINGS_PRESETS: ChartSettingsPreset[] = [
  makePreset(
    "trading-dark",
    "Trading Dark",
    "Default dark theme",
    baseAppearance({
      backgroundColor: "#131722",
      gridColor: "#2A2E39",
      axisTextColor: "#D1D4DC",
      axisBackgroundColor: "#131722",
      chartLineColor: "#2962FF",
      chartFillColor: "rgba(41, 98, 255, 0.25)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#2962FF",
      chartFillGradientOpacity: 0.45,
      crosshairColor: "#2962FF",
    }),
    {
      mode: "dark",
      surround: "#1E222D",
      toolbar: "#1E222D",
      dialog: "#1E222D",
      input: "#2A2E39",
      accent: "#2962FF",
      uiAccent: "#9598A1",
      muted: "#787B86",
      inputBorder: "1px solid #434651",
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
      crosshairColor: "#5B8CFF",
    }),
    {
      mode: "dark",
      surround: "#090E18",
      toolbar: "#090E18",
      dialog: "#0C1220",
      input: "#151D2E",
      accent: "#5B8CFF",
      uiAccent: "#8BA4C9",
      muted: "#8B9BB5",
      inputBorder: "1px solid #243044",
    },
  ),
  makePreset(
    "carbon",
    "Carbon",
    "Neutral gray workspace",
    baseAppearance({
      backgroundColor: "#1C1C1C",
      gridColor: "#323232",
      axisTextColor: "#C7C7C7",
      axisBackgroundColor: "#1C1C1C",
      chartLineColor: "#4DA3FF",
      chartFillColor: "rgba(77, 163, 255, 0.2)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#4DA3FF",
      chartFillGradientOpacity: 0.4,
      candleUpColor: "#4CAF50",
      candleDownColor: "#E53935",
      crosshairColor: "#4DA3FF",
    }),
    {
      mode: "dark",
      surround: "#141414",
      toolbar: "#141414",
      dialog: "#1C1C1C",
      input: "#262626",
      accent: "#4DA3FF",
      uiAccent: "#9CA3AF",
      muted: "#9CA3AF",
      inputBorder: "1px solid #3A3A3A",
    },
  ),
  makePreset(
    "onyx",
    "Onyx",
    "Warm charcoal with amber accents",
    baseAppearance({
      backgroundColor: "#141210",
      gridColor: "#2C2A27",
      axisTextColor: "#D4CFC6",
      axisBackgroundColor: "#141210",
      chartLineColor: "#FFAB40",
      chartFillColor: "rgba(255, 171, 64, 0.2)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#FFAB40",
      chartFillGradientOpacity: 0.4,
      candleUpColor: "#66BB6A",
      candleDownColor: "#EF5350",
      crosshairColor: "#FFAB40",
      gridLineStyle: "dashed",
    }),
    {
      mode: "dark",
      surround: "#1C1A17",
      toolbar: "#1C1A17",
      dialog: "#242220",
      input: "#2E2C28",
      accent: "#FFAB40",
      uiAccent: "#C8C4BC",
      muted: "#9E9890",
      inputBorder: "1px solid #3D3A35",
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
      input: "#F0F3FA",
      accent: "#2962FF",
      text: "#131722",
      muted: "#787B86",
      inputBorder: "1px solid #E0E3EB",
    },
  ),
  makePreset(
    "paper",
    "Paper",
    "Warm cream paper tone",
    baseAppearance({
      backgroundColor: "#FFFDF8",
      gridColor: "#E8E4DC",
      axisTextColor: "#3D3929",
      axisBackgroundColor: "#F5F1E8",
      chartLineColor: "#B45309",
      chartFillColor: "rgba(180, 83, 9, 0.12)",
      chartLineFillVisible: true,
      chartLineFillMode: "gradient",
      chartFillGradientColor: "#B45309",
      chartFillGradientOpacity: 0.35,
      candleUpColor: "#2F855A",
      candleDownColor: "#C53030",
      crosshairColor: "#B45309",
    }),
    {
      mode: "light",
      surround: "#F5F1E8",
      toolbar: "#F5F1E8",
      dialog: "#FFFDF8",
      input: "#EDE8DE",
      accent: "#B45309",
      uiAccent: "#B45309",
      text: "#3D3929",
      muted: "#7A7368",
      inputBorder: "1px solid #D9D2C4",
    },
  ),
];

export { buildChartUiTheme };

const tradingDarkPreset = CHART_SETTINGS_PRESETS.find((preset) => preset.id === "trading-dark")!;

export const DEFAULT_CHART_UI_THEME = tradingDarkPreset.uiTheme as ChartUITheme;
export const DEFAULT_CHART_SETTINGS_TEMPLATE = tradingDarkPreset.template;
