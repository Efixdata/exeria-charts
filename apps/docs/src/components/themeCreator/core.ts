import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { ChartInstance, Candle, Instrument, Interval } from "@efixdata/exeria-chart";
import { docsExampleDatasets, docsInterval, getCandleAtRatio } from "../chartExampleData";

export type ChartColorKey =
  | "accent"
  | "background"
  | "axisText"
  | "grid"
  | "candleUp"
  | "candleDown"
  | "crosshair"
  | "tool";

export type UiColorKey =
  | "accent"
  | "toolbarBackground"
  | "panel"
  | "panelStrong"
  | "text"
  | "mutedText"
  | "divider";

export type ThemeVariant = "dark" | "light";

export const themeVariants: ThemeVariant[] = ["dark", "light"];
export type VariantPalette<T extends string> = Record<ThemeVariant, Record<T, string>>;

export interface ChartColorState extends Record<ChartColorKey, string> {}
export interface UiColorState extends Record<UiColorKey, string> {}

export interface ThemePreset {
  id: string;
  label: string;
  chart: VariantPalette<ChartColorKey>;
  ui: VariantPalette<UiColorKey>;
}

export interface ColorControl<T extends string> {
  key: T;
  label: string;
  description: string;
}

export const chartColorControls: ColorControl<ChartColorKey>[] = [
  {
    key: "background",
    label: "Chart background",
    description: "Canvas and axis background behind candles and indicators.",
  },
  {
    key: "axisText",
    label: "Axis text",
    description: "Price-axis and time-axis label color.",
  },
  {
    key: "grid",
    label: "Grid",
    description: "Horizontal and vertical grid lines inside the chart panel.",
  },
  {
    key: "accent",
    label: "Chart accent",
    description: "Selection handles, marker accents, and other highlighted runtime details.",
  },
  {
    key: "candleUp",
    label: "Up candle",
    description: "Bullish candles and buy-oriented runtime markers.",
  },
  {
    key: "candleDown",
    label: "Down candle",
    description: "Bearish candles and sell-oriented runtime markers.",
  },
  {
    key: "crosshair",
    label: "Crosshair",
    description: "Crosshair line and its outer label treatment.",
  },
  {
    key: "tool",
    label: "Tool default",
    description: "Default drawing-tool stroke and text color when a tool has no custom color.",
  },
];

export const uiColorControls: ColorControl<UiColorKey>[] = [
  {
    key: "toolbarBackground",
    label: "Toolbar background",
    description: "Top toolbar chrome behind draw-mode, indicators, and interval controls.",
  },
  {
    key: "panel",
    label: "Dialog panel",
    description: "Dialog and content-surface background used by menus and overlays.",
  },
  {
    key: "panelStrong",
    label: "Submenu surface",
    description: "Stronger panel surface for left menu and open split buttons.",
  },
  {
    key: "accent",
    label: "UI accent",
    description: "Primary UI accent for highlights, scrollbar hover, and active surfaces.",
  },
  {
    key: "text",
    label: "UI text",
    description: "Primary text for toolbar, menus, and dialogs.",
  },
  {
    key: "mutedText",
    label: "Muted UI text",
    description: "Secondary text and lower-emphasis labels in UI chrome.",
  },
  {
    key: "divider",
    label: "Divider",
    description: "Borders, separators, and scrollbar thumb base color.",
  },
];

export const themePresets: ThemePreset[] = [
  {
    id: "swipper",
    label: "Swipper",
    chart: createChartVariantState({
      accent: "#1EA1CD",
      background: "#0E2A3C",
      axisText: "#1EA1CD",
      grid: "#274D63",
      candleUp: "#3CC3AF",
      candleDown: "#CE3E5B",
      crosshair: "#21C1F2",
      tool: "#1EA1CD",
    }),
    ui: createUiVariantState({
      accent: "#3CC3AF",
      toolbarBackground: "#113D59",
      panel: "#144869",
      panelStrong: "#1EA1CD",
      text: "#FFFFFF",
      mutedText: "#D4F0FF",
      divider: "#76CBE4",
    }),
  },
  {
    id: "signal",
    label: "Signal",
    chart: createChartVariantState({
      accent: "#13F899",
      background: "#100C22",
      axisText: "#6D86B1",
      grid: "#15132B",
      candleUp: "#17F7AB",
      candleDown: "#FF007B",
      crosshair: "#13F899",
      tool: "#F7FBFF",
    }),
    ui: createUiVariantState({
      accent: "#13F899",
      toolbarBackground: "#0D0B1B",
      panel: "#181433",
      panelStrong: "#201E3E",
      text: "#F5FFFD",
      mutedText: "#8FA6C9",
      divider: "#6D86B1",
    }),
  },
  {
    id: "exeria",
    label: "Exeria",
    chart: createChartVariantState({
      accent: "#2196F3",
      background: "#282B38",
      axisText: "#C7D3E8",
      grid: "#353741",
      candleUp: "#259B24",
      candleDown: "#E51C23",
      crosshair: "#2196F3",
      tool: "#F3F8FF",
    }),
    ui: createUiVariantState({
      accent: "#2196F3",
      toolbarBackground: "#1F2029",
      panel: "#2F3444",
      panelStrong: "#246197",
      text: "#FFFFFF",
      mutedText: "#D3E3FF",
      divider: "#90B8E2",
    }),
  },
  {
    id: "ocean",
    label: "Ocean",
    chart: createChartVariantState({
      accent: "#38BDF8",
      background: "#07111F",
      axisText: "#7DD3FC",
      grid: "#123047",
      candleUp: "#2DD4BF",
      candleDown: "#FB7185",
      crosshair: "#38BDF8",
      tool: "#E0F2FE",
    }),
    ui: createUiVariantState({
      accent: "#38BDF8",
      toolbarBackground: "#0B1728",
      panel: "#102338",
      panelStrong: "#1D4ED8",
      text: "#F0F9FF",
      mutedText: "#93C5FD",
      divider: "#3B82F6",
    }),
  },
  {
    id: "ember",
    label: "Ember",
    chart: createChartVariantState({
      accent: "#F59E0B",
      background: "#14100C",
      axisText: "#D6B48C",
      grid: "#2A2118",
      candleUp: "#84CC16",
      candleDown: "#EF4444",
      crosshair: "#FBBF24",
      tool: "#FFF7ED",
    }),
    ui: createUiVariantState({
      accent: "#F59E0B",
      toolbarBackground: "#1A1410",
      panel: "#241B14",
      panelStrong: "#B45309",
      text: "#FFF7ED",
      mutedText: "#D6B48C",
      divider: "#92400E",
    }),
  },
];

const chartFontValues = {
  title: "600 12px Mulish, Roboto, Tahoma, Arial, sans-serif",
  text: "11px Mulish, Roboto, Tahoma, Arial, sans-serif",
  price: "600 12px Mulish, Roboto, Tahoma, Arial, sans-serif",
  priceSubscript: "600 10px Mulish, Roboto, Tahoma, Arial, sans-serif",
  time: "600 11px Mulish, Roboto, Tahoma, Arial, sans-serif",
  legend: "12px Mulish, Roboto, Tahoma, Arial, sans-serif",
  legendSubscript: "10px Mulish, Roboto, Tahoma, Arial, sans-serif",
  fontName: "Mulish",
};

export const previewCandles = docsExampleDatasets.trend.candles;
export const previewInstrument: Instrument = {
  id: "BTCUSD",
  symbol: "BTC/USD",
  name: "Bitcoin / US Dollar",
  currency: "USD",
  precision: 2,
  chart: "ohlc",
  availableIntervals: [docsInterval],
  interval: docsInterval,
};

function parseHexColor(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  const safeColor = normalized.length === 3
    ? normalized
        .split("")
        .map((value) => value + value)
        .join("")
    : normalized;

  return {
    r: Number.parseInt(safeColor.slice(0, 2), 16),
    g: Number.parseInt(safeColor.slice(2, 4), 16),
    b: Number.parseInt(safeColor.slice(4, 6), 16),
  };
}

function toHexColor(value: number) {
  return Math.min(255, Math.max(0, Math.round(value))).toString(16).padStart(2, "0");
}

function mixColors(first: string, second: string, ratio: number) {
  const from = parseHexColor(first);
  const to = parseHexColor(second);
  const weight = Math.min(1, Math.max(0, ratio));

  return `#${toHexColor(from.r + (to.r - from.r) * weight)}${toHexColor(
    from.g + (to.g - from.g) * weight
  )}${toHexColor(from.b + (to.b - from.b) * weight)}`;
}

function withAlpha(color: string, alpha: number) {
  const { r, g, b } = parseHexColor(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastColor(color: string, dark = "#08111B", light = "#FFFFFF") {
  const { r, g, b } = parseHexColor(color);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 145 ? dark : light;
}

function deriveLightChartColors(chartColors: ChartColorState): ChartColorState {
  return {
    accent: mixColors(chartColors.accent, "#18324D", 0.18),
    background: mixColors(chartColors.background, "#F7FAFD", 0.95),
    axisText: mixColors(chartColors.axisText, "#25354A", 0.74),
    grid: mixColors(chartColors.grid, "#FFFFFF", 0.82),
    candleUp: mixColors(chartColors.candleUp, "#0F5132", 0.16),
    candleDown: mixColors(chartColors.candleDown, "#8A1C2F", 0.14),
    crosshair: mixColors(chartColors.crosshair, "#334155", 0.4),
    tool: mixColors(chartColors.tool, "#3A4D63", 0.58),
  };
}

function deriveLightUiColors(uiColors: UiColorState): UiColorState {
  return {
    accent: mixColors(uiColors.accent, "#18324D", 0.16),
    toolbarBackground: mixColors(uiColors.toolbarBackground, "#F7FAFD", 0.95),
    panel: mixColors(uiColors.panel, "#FFFFFF", 0.93),
    panelStrong: mixColors(uiColors.panelStrong, "#EEF4FB", 0.72),
    text: "#162133",
    mutedText: "#5D718B",
    divider: mixColors(uiColors.divider, "#D7E0EB", 0.48),
  };
}

function createChartVariantState(darkColors: ChartColorState): VariantPalette<ChartColorKey> {
  return {
    dark: darkColors,
    light: deriveLightChartColors(darkColors),
  };
}

function createUiVariantState(darkColors: UiColorState): VariantPalette<UiColorKey> {
  return {
    dark: darkColors,
    light: deriveLightUiColors(darkColors),
  };
}

export function cloneVariantPalette<T extends string>(palette: VariantPalette<T>): VariantPalette<T> {
  return {
    dark: { ...palette.dark },
    light: { ...palette.light },
  };
}

function buildChartFonts() {
  return Object.fromEntries(
    Object.entries(chartFontValues).map(([key, value]) => [key, { dark: value, light: value }])
  ) as Record<string, Record<ThemeVariant, string>>;
}

function buildChartThemeVariant(
  chartColors: ChartColorState,
  themeVariant: ThemeVariant
): Record<string, string> {
  const isLight = themeVariant === "light";
  const textColor = getContrastColor(chartColors.background, "#08111B", "#FFFFFF");
  const mutedText = withAlpha(textColor, isLight ? 0.42 : 0.52);
  const gridAccent = mixColors(chartColors.grid, chartColors.background, isLight ? 0.32 : 0.2);
  const chartGray = mixColors(chartColors.axisText, chartColors.background, isLight ? 0.52 : 0.45);
  const tipBackground = mixColors(chartColors.background, chartColors.crosshair, isLight ? 0.1 : 0.18);
  const tipTextColor = getContrastColor(tipBackground, "#08111B", "#FFFFFF");

  return {
    accent: chartColors.accent,
    primaryTextColor: textColor,
    disabledTextColor: mutedText,
    handlerColor: withAlpha(chartColors.axisText, isLight ? 0.12 : 0.16),
    iconColor: isLight ? "#08111B" : chartColors.accent,
    backgroundColor: chartColors.background,
    timeAxisBackground: chartColors.background,
    priceAxisBackground: chartColors.background,
    timeAxisTextColor: chartColors.axisText,
    priceAxisTextColor: chartColors.axisText,
    gridColor: chartColors.grid,
    chartZeroColor: chartColors.accent,
    chartRed: chartColors.candleDown,
    chartGreen: chartColors.candleUp,
    chartGreenBackground: mixColors(chartColors.candleUp, chartColors.background, isLight ? 0.28 : 0.32),
    chartGray,
    chartGrayPrimary: mixColors(chartColors.axisText, chartColors.background, isLight ? 0.38 : 0.28),
    chartRedStroke: mixColors(chartColors.candleDown, chartColors.background, isLight ? 0.28 : 0.22),
    chartGreenStroke: mixColors(chartColors.candleUp, chartColors.background, isLight ? 0.28 : 0.22),
    chartFill: withAlpha(chartColors.accent, isLight ? 0.14 : 0.22),
    chartStroke: chartColors.accent,
    buyColor: chartColors.candleUp,
    sellColor: chartColors.candleDown,
    exitAllColor: chartGray,
    defaultToolColor: chartColors.tool,
    defaultToolTextColor: getContrastColor(chartColors.tool, "#08111B", "#FFFFFF"),
    crosshairColor: chartColors.crosshair,
    crosshairTextColor: getContrastColor(chartColors.crosshair, "#08111B", "#FFFFFF"),
    crosshairInnerColor: chartColors.background,
    crosshairInnerTextColor: textColor,
    tipBackground,
    tipTextColor,
    tipUnderline: withAlpha(tipTextColor, 0.12),
    indicatorMarker: gridAccent,
    hitColor: withAlpha(textColor, isLight ? 0.54 : 0.72),
    darkTextColor: "#08111B",
    overlay: chartGray,
    legendLabelColor: withAlpha(textColor, isLight ? 0.62 : 0.72),
    legendValueColor: textColor,
    legendLineBackground: withAlpha(chartColors.background, isLight ? 0.94 : 0.82),
    fibonacciRetracementLine: withAlpha(textColor, isLight ? 0.08 : 0.12),
  };
}

export function buildChartTheme(chartColorsByVariant: VariantPalette<ChartColorKey>) {
  const colors: Record<string, Partial<Record<ThemeVariant, string>>> = {};

  themeVariants.forEach((variant) => {
    const variantColors = buildChartThemeVariant(chartColorsByVariant[variant], variant);

    Object.entries(variantColors).forEach(([token, value]) => {
      colors[token] = {
        ...colors[token],
        [variant]: value,
      };
    });
  });

  return {
    colors,
    fonts: buildChartFonts(),
  };
}

export function buildUiTheme(uiColors: UiColorState, themeVariant: ThemeVariant) {
  const isLight = themeVariant === "light";
  const control = withAlpha(uiColors.accent, isLight ? 0.1 : 0.14);
  const controlActive = mixColors(uiColors.accent, uiColors.panelStrong, isLight ? 0.22 : 0.38);

  return {
    border: {
      inner: `1px solid ${withAlpha(uiColors.divider, isLight ? 0.32 : 0.22)}`,
      outter: `1px solid ${withAlpha(uiColors.divider, isLight ? 0.32 : 0.22)}`,
      radius: 20,
    },
    gap: 10,
    accentColor: uiColors.accent,
    buttons: {
      color: uiColors.text,
      activeColor: uiColors.text,
      activeBackground: controlActive,
      hoverColor: uiColors.text,
      hoverBackground: control,
    },
    radioButton: {
      background: control,
      buttons: {
        color: uiColors.mutedText,
        activeColor: uiColors.text,
        hoverColor: uiColors.text,
        hoverBackground: control,
      },
    },
    toolbar: {
      background: uiColors.toolbarBackground,
      buttons: {
        color: uiColors.mutedText,
        activeColor: uiColors.text,
        activeBackground: controlActive,
        hoverColor: uiColors.text,
        hoverBackground: control,
      },
      showCurrency: false,
      showShareChartButton: false,
      showChartScaleSwitch: true,
      topMenuPosition: "right",
    },
    subMenu: {
      background: uiColors.panelStrong,
      buttons: {
        color: uiColors.text,
        activeColor: uiColors.text,
        activeBackground: controlActive,
        hoverColor: uiColors.text,
        hoverBackground: control,
      },
    },
    splitButton: {
      openBackground: uiColors.panelStrong,
      hoverBackground: uiColors.panelStrong,
      openColor: uiColors.text,
      hoverColor: uiColors.text,
      arrowHoverBackground: control,
      arrowColor: uiColors.accent,
      arrowOpenColor: uiColors.accent,
    },
    dialog: {
      backgroundColor: uiColors.panel,
      titleColor: uiColors.text,
      textColor: uiColors.text,
      dividerColor: withAlpha(uiColors.divider, isLight ? 0.22 : 0.18),
      itemTitleColor: uiColors.text,
      itemSubTitleColor: uiColors.mutedText,
      itemHoverBackgroundColor: control,
    },
    inputs: {
      backgroundColor: uiColors.panelStrong,
      placeholderColor: uiColors.mutedText,
      textColor: uiColors.text,
      labelColor: uiColors.text,
    },
    scrollBar: {
      trackColor: withAlpha(isLight ? "#08111B" : uiColors.text, 0.04),
      thumbColor: withAlpha(uiColors.divider, isLight ? 0.68 : 0.42),
      thumbHoverColor: uiColors.accent,
    },
  };
}

export function formatCodeBlock(name: string, value: unknown) {
  return `const ${name} = ${JSON.stringify(value, null, 2)};`;
}

export function formatApplySnippet(
  runtimeTheme: unknown,
  uiThemes: unknown,
  interval: Interval,
  themeVariant: ThemeVariant
) {
  return [
    'import { createChart } from "@efixdata/exeria-chart";',
    'import { ChartUI } from "@efixdata/exeria-chart-ui-react";',
    "",
    formatCodeBlock("runtimeTheme", runtimeTheme),
    "",
    formatCodeBlock("uiThemes", uiThemes),
    "",
    `const themeVariant = "${themeVariant}";`,
    "const uiTheme = uiThemes[themeVariant];",
    "",
    `const interval = ${JSON.stringify(interval, null, 2)};`,
    "",
    "const chart = createChart({",
    "  container,",
    "  instrument,",
    "  theme: runtimeTheme,",
    "  themeVariant,",
    "});",
    "",
    "chart.init();",
    "await chart.setMainSeriesData(candles, interval);",
    "",
    "<ChartUI chart={chart} theme={uiTheme}>",
    "  <div ref={containerRef} />",
    "</ChartUI>;",
  ].join("\n");
}

export function capitalizeThemeVariant(themeVariant: ThemeVariant) {
  return themeVariant.charAt(0).toUpperCase() + themeVariant.slice(1);
}

export function drawPreviewOverlays(chart: ChartInstance, candles: Candle[]) {
  const first = getCandleAtRatio(candles, 0.2);
  const second = getCandleAtRatio(candles, 0.42);
  const level = getCandleAtRatio(candles, 0.7);

  chart.toolDrawer.drawTrendLine({
    startStamp: first.stamp,
    endStamp: second.stamp,
    startPrice: first.l,
    endPrice: second.h,
    config: {
      editable: false,
    },
  });

  chart.toolDrawer.drawTool({
    type: "hLine",
    anchors: [
      {
        stamp: level.stamp,
        offset: 0,
        value: level.c,
        _index: 0,
      },
    ],
    editable: false,
  });
}
