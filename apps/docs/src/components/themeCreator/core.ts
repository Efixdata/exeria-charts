import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type {
  ChartAppearanceSettings,
  ChartInstance,
  Candle,
  Instrument,
  Interval,
} from "@efixdata/exeria-chart";
import { buildChartUiTheme } from "../../../../../packages/react-chart-ui/src/components/TopMenu/ChartSettings/chartSettingsPresets";
import { docsExampleDatasets, docsInterval, getCandleAtRatio } from "../chartExampleData";

export type ChartColorKey =
  | "accent"
  | "background"
  | "axisText"
  | "grid"
  | "candleUp"
  | "candleDown"
  | "candleUpStroke"
  | "candleDownStroke"
  | "crosshair"
  | "tool";

export type UiColorKey =
  | "accent"
  | "toolbarBackground"
  | "panel"
  | "panelStrong"
  | "inputSurface"
  | "text"
  | "mutedText"
  | "divider"
  | "inputBorder";

export type ThemeVariant = "dark" | "light";

export const themeVariants: ThemeVariant[] = ["dark", "light"];
export type VariantPalette<T extends string> = Record<ThemeVariant, Record<T, string>>;

export interface ChartColorState extends Record<ChartColorKey, string> {}
export interface UiColorState extends Record<UiColorKey, string> {}

export interface ThemePreset {
  id: string;
  label: string;
  chipLabel: string;
  chipColor: string;
  description?: string;
  preferredVariant?: ThemeVariant;
  swatches?: {
    background: string;
    up: string;
    down: string;
    grid: string;
    chrome: string;
  };
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

const chartFontValues = {
  title: '600 12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  text: '11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  price: '600 12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  priceSubscript: '600 10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  time: '600 11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  legend: '12px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  legendSubscript: '10px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontName: "Inter",
};

export const previewCandles = docsExampleDatasets.trend.candles;

export const PLAYGROUND_MAIN_SERIES_ID = "playground-btc";

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

function createInstrumentSeriesEntry(seriesId: string, instrument: Instrument, data?: Candle[]) {
  return {
    seriesId,
    title: instrument.symbol,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument,
    interval: docsInterval,
    ...(data ? { data } : {}),
  };
}

function createMainSeriesPlotter(seriesId: string) {
  return {
    id: seriesId,
    type: "SeriesObject",
    dataLink: seriesId,
    renderAs: "OHLC",
    color: "#00bcd4",
    stroke: [1],
    dash: [],
    width: 1,
    priceTag: true,
    priceLine: true,
    openDataField: "o",
    highDataField: "h",
    lowDataField: "l",
    closeDataField: "c",
    dataField: "c",
    strokeStyle: "#00bcd4",
    _hit: false,
    _hitAnchor: null,
    _hitArrow: null,
    selected: false,
  };
}

export function createPlaygroundChartModel(): Record<string, unknown> {
  return {
    mainSeries: PLAYGROUND_MAIN_SERIES_ID,
    interval: docsInterval,
    instrumentsSeries: [createInstrumentSeriesEntry(PLAYGROUND_MAIN_SERIES_ID, previewInstrument)],
    panels: [
      {
        id: "1",
        valueAxisMode: "lin",
        main: true,
        hGrid: true,
        vGrid: true,
        basis: 75,
        precision: 2,
        centerZero: false,
        objects: [createMainSeriesPlotter(PLAYGROUND_MAIN_SERIES_ID)],
        _visible: true,
        _index: 0,
      },
    ],
  };
}

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
  const background = mixColors(chartColors.background, "#F7FAFD", 0.95);
  const candleUp = mixColors(chartColors.candleUp, "#0F5132", 0.16);
  const candleDown = mixColors(chartColors.candleDown, "#8A1C2F", 0.14);

  return {
    accent: mixColors(chartColors.accent, "#18324D", 0.18),
    background,
    axisText: mixColors(chartColors.axisText, "#25354A", 0.74),
    grid: mixColors(chartColors.grid, "#FFFFFF", 0.82),
    candleUp,
    candleDown,
    candleUpStroke: mixColors(chartColors.candleUpStroke, "#FFFFFF", 0.82),
    candleDownStroke: mixColors(chartColors.candleDownStroke, "#FFFFFF", 0.82),
    crosshair: mixColors(chartColors.crosshair, "#334155", 0.4),
    tool: mixColors(chartColors.tool, "#3A4D63", 0.58),
  };
}

function deriveLightUiColors(uiColors: UiColorState): UiColorState {
    // @ts-ignore
    // @ts-ignore
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
    chartRedStroke: chartColors.candleDownStroke,
    chartGreenStroke: chartColors.candleUpStroke,
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
    legendLineBackground: "transparent",
    fibonacciRetracementLine: withAlpha(textColor, isLight ? 0.08 : 0.12),
  };
}

export function deriveCandleStrokeColors(
  chartColors: ChartColorState,
  themeVariant: ThemeVariant,
): Pick<ChartColorState, "candleUpStroke" | "candleDownStroke"> {
  const ratio = themeVariant === "light" ? 0.28 : 0.22;

  return {
    candleUpStroke: mixColors(chartColors.candleUp, chartColors.background, ratio),
    candleDownStroke: mixColors(chartColors.candleDown, chartColors.background, ratio),
  };
}

export type SimpleChartThemeColors = {
  background: string;
  grid: string;
  candleUp: string;
  candleDown: string;
  accent?: string;
  axisText?: string;
  crosshair?: string;
  tool?: string;
};

/** Maps tutorial-style color keys to the runtime theme shape expected by createChart. */
export function buildSimpleChartTheme(
  colors: SimpleChartThemeColors,
  themeVariant: ThemeVariant = "dark",
) {
  const baseColors: ChartColorState = {
    accent: colors.accent ?? colors.candleUp,
    background: colors.background,
    axisText: colors.axisText ?? (themeVariant === "light" ? "#5f6b7a" : "#8b949e"),
    grid: colors.grid,
    // @ts-ignore
    candleUp: colors.candleUp,
    // @ts-ignore
    // @ts-ignore
    candleDown: colors.candleDown,
    // @ts-ignore
    // @ts-ignore
    candleUpStroke: colors.candleUp,
    // @ts-ignore
    candleDownStroke: colors.candleDown,
    crosshair: colors.crosshair ?? colors.accent ?? colors.candleUp,
    tool: colors.tool ?? colors.accent ?? "#5cc8ff",
    ...deriveCandleStrokeColors(
      {
        accent: colors.accent ?? colors.candleUp,
        background: colors.background,
        axisText: colors.axisText ?? (themeVariant === "light" ? "#5f6b7a" : "#8b949e"),
        grid: colors.grid,
        candleUp: colors.candleUp,
        candleDown: colors.candleDown,
        candleUpStroke: colors.candleUp,
        candleDownStroke: colors.candleDown,
        crosshair: colors.crosshair ?? colors.accent ?? colors.candleUp,
        tool: colors.tool ?? colors.accent ?? "#5cc8ff",
      },
      themeVariant,
    ),
  };

  return buildChartTheme({
    dark: baseColors,
    light: baseColors,
  });
}

export function buildChartAppearanceSettings(
  chartColors: ChartColorState,
  themeVariant: ThemeVariant = "dark",
): ChartAppearanceSettings {
  const isLight = themeVariant === "light";

  return {
    backgroundColor: chartColors.background,
    gridColor: chartColors.grid,
    chartLineColor: chartColors.accent,
    chartFillColor: withAlpha(chartColors.accent, isLight ? 0.14 : 0.22),
    chartLineFillVisible: false,
    chartLineFillMode: "solid",
    chartFillGradientColor: chartColors.accent,
    chartFillGradientOpacity: 0.4,
    candleUpColor: chartColors.candleUp,
    candleDownColor: chartColors.candleDown,
    candleUpStrokeColor: chartColors.candleUpStroke,
    candleDownStrokeColor: chartColors.candleDownStroke,
    axisTextColor: chartColors.axisText,
    axisBackgroundColor: chartColors.background,
    crosshairColor: chartColors.crosshair,
    gridMode: "both",
    gridVisible: true,
    gridLineStyle: "solid",
    lastPriceLineVisible: true,
    lastPriceLabelVisible: true,
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

export function buildUiTheme(
  uiColors: UiColorState,
  themeVariant: ThemeVariant,
  chartAccent?: string,
) {
  return buildChartUiTheme({
    mode: themeVariant === "light" ? "light" : "dark",
    surround: uiColors.toolbarBackground,
    toolbar: uiColors.toolbarBackground,
    dialog: uiColors.panel,
    input: uiColors.inputSurface,
    accent: chartAccent ?? uiColors.accent,
    uiAccent: uiColors.accent,
    text: uiColors.text,
    muted: uiColors.mutedText,
    inputBorder: uiColors.inputBorder,
  });
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
