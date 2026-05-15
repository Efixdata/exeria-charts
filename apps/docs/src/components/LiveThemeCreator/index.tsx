import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ComponentType } from "react";
import type { ChartInstance, Candle, Instrument, Interval } from "@efixdata/exeria-chart";
import { docsExampleDatasets, docsInterval, getCandleAtRatio } from "../chartExampleData";

type ChartColorKey =
  | "accent"
  | "background"
  | "axisText"
  | "grid"
  | "candleUp"
  | "candleDown"
  | "crosshair"
  | "tool";

type UiColorKey =
  | "accent"
  | "toolbarBackground"
  | "panel"
  | "panelStrong"
  | "text"
  | "mutedText"
  | "divider";

type ThemeVariant = "dark" | "light";

const themeVariants: ThemeVariant[] = ["dark", "light"];
type VariantPalette<T extends string> = Record<ThemeVariant, Record<T, string>>;

interface ChartColorState extends Record<ChartColorKey, string> {}
interface UiColorState extends Record<UiColorKey, string> {}

interface ThemePreset {
  id: string;
  label: string;
  chart: VariantPalette<ChartColorKey>;
  ui: VariantPalette<UiColorKey>;
}

interface ColorControl<T extends string> {
  key: T;
  label: string;
  description: string;
}

const chartColorControls: ColorControl<ChartColorKey>[] = [
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

const uiColorControls: ColorControl<UiColorKey>[] = [
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

const themePresets: ThemePreset[] = [
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

const previewCandles = docsExampleDatasets.trend.candles;
const previewInstrument: Instrument = {
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

function cloneVariantPalette<T extends string>(palette: VariantPalette<T>): VariantPalette<T> {
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

function buildChartTheme(chartColorsByVariant: VariantPalette<ChartColorKey>) {
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

function buildUiTheme(uiColors: UiColorState, themeVariant: ThemeVariant) {
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
      showChartScaleSwitch: false,
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

function formatCodeBlock(name: string, value: unknown) {
  return `const ${name} = ${JSON.stringify(value, null, 2)};`;
}

function formatApplySnippet(
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

function capitalizeThemeVariant(themeVariant: ThemeVariant) {
  return themeVariant.charAt(0).toUpperCase() + themeVariant.slice(1);
}

function drawPreviewOverlays(chart: ChartInstance, candles: Candle[]) {
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

export default function LiveThemeCreator() {
  const defaultPreset = themePresets[1] ?? themePresets[0];
  const [presetId, setPresetId] = useState(defaultPreset?.id ?? "signal");
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>("dark");
  const [chartColorsByVariant, setChartColorsByVariant] = useState<VariantPalette<ChartColorKey>>(
    cloneVariantPalette(defaultPreset?.chart ?? themePresets[0]!.chart)
  );
  const [uiColorsByVariant, setUiColorsByVariant] = useState<VariantPalette<UiColorKey>>(
    cloneVariantPalette(defaultPreset?.ui ?? themePresets[0]!.ui)
  );
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<any> | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const chartColors = chartColorsByVariant[themeVariant];
  const uiColors = uiColorsByVariant[themeVariant];
  const runtimeTheme = useMemo(() => buildChartTheme(chartColorsByVariant), [chartColorsByVariant]);
  const uiThemes = useMemo(
    () => ({
      dark: buildUiTheme(uiColorsByVariant.dark, "dark"),
      light: buildUiTheme(uiColorsByVariant.light, "light"),
    }),
    [uiColorsByVariant]
  );
  const activeUiTheme = uiThemes[themeVariant];

  const runtimeThemeCode = useMemo(() => formatCodeBlock("runtimeTheme", runtimeTheme), [runtimeTheme]);
  const uiThemeCode = useMemo(() => formatCodeBlock("uiThemes", uiThemes), [uiThemes]);
  const applyCode = useMemo(
    () => formatApplySnippet(runtimeTheme, uiThemes, docsInterval, themeVariant),
    [runtimeTheme, themeVariant, uiThemes]
  );

  const previewThemeKey = useMemo(
    () => JSON.stringify({ runtimeTheme, themeVariant }),
    [runtimeTheme, themeVariant]
  );

  useEffect(() => {
    let disposed = false;

    import("@efixdata/exeria-chart-ui-react")
      .then((module) => {
        if (!disposed) {
          setChartUIComponent(() => module.ChartUI as ComponentType<any>);
        }
      })
      .catch((error: unknown) => {
        console.error("Failed to load ChartUI", error);
        if (!disposed) {
          setPreviewError("Failed to load the React UI preview component.");
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const mountChart = async () => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      setPreviewError(null);
      setChart(null);

      const chartModule = await import("@efixdata/exeria-chart");
      if (disposed) {
        return;
      }

      const chartInstance = chartModule.createChart({
        container,
        instrument: previewInstrument,
        theme: runtimeTheme,
        themeVariant,
      });

      try {
        chartInstance.init();
        await chartInstance.setMainSeriesData(previewCandles, docsInterval);
        chartInstance.setMainDrawMode("OHLC");
        drawPreviewOverlays(chartInstance, previewCandles);

        if (disposed) {
          chartInstance.destroy();
          return;
        }

        setChart(chartInstance);
      } catch (error) {
        chartInstance.destroy();

        if (!disposed) {
          setPreviewError(
            error instanceof Error ? error.message : "Failed to initialize the live chart preview."
          );
        }
      }
    };

    void mountChart();

    return () => {
      disposed = true;
      setChart((currentChart) => {
        currentChart?.destroy();
        return null;
      });
    };
  }, [previewThemeKey]);

  useEffect(() => {
    if (!copiedLabel) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedLabel(null);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedLabel]);

  const handlePresetChange = (preset: ThemePreset) => {
    setPresetId(preset.id);
    setChartColorsByVariant(cloneVariantPalette(preset.chart));
    setUiColorsByVariant(cloneVariantPalette(preset.ui));
  };

  const handleChartColorChange = (key: ChartColorKey, value: string) => {
    setChartColorsByVariant((current) => ({
      ...current,
      [themeVariant]: {
        ...current[themeVariant],
        [key]: value,
      },
    }));
  };

  const handleUiColorChange = (key: UiColorKey, value: string) => {
    setUiColorsByVariant((current) => ({
      ...current,
      [themeVariant]: {
        ...current[themeVariant],
        [key]: value,
      },
    }));
  };

  const copyText = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLabel(label);
    } catch (error) {
      console.error("Failed to copy theme code", error);
      setCopiedLabel("Copy failed");
    }
  };

  const ChartUIPreview = ChartUIComponent;

  return (
    <div style={styles.wrapper}>
      <section style={styles.presetSection}>
        <div>
          <span style={styles.eyebrow}>Start from a preset</span>
          <h2 style={styles.sectionTitle}>Theme direction</h2>
          <p style={styles.sectionText}>
            Each preset seeds both the chart runtime palette and the React UI chrome. After that,
            tweak the chart and UI sections independently.
          </p>
        </div>

        <div style={styles.presetRow}>
          {themePresets.map((preset) => {
            const isActive = preset.id === presetId;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset)}
                style={isActive ? styles.activePresetButton : styles.presetButton}
              >
                <span
                  style={{
                    ...styles.presetSwatch,
                    background: `linear-gradient(135deg, ${preset.chart[themeVariant].accent}, ${preset.ui[themeVariant].accent})`,
                  }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>

        <div style={styles.variantSection}>
          <span style={styles.variantLabel}>Preview and code variant</span>

          <div style={styles.variantButtons}>
            {themeVariants.map((variant) => {
              const isActive = variant === themeVariant;

              return (
                <button
                  key={variant}
                  type="button"
                  onClick={() => setThemeVariant(variant)}
                  style={isActive ? styles.activeVariantButton : styles.variantButton}
                >
                  {capitalizeThemeVariant(variant)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div style={styles.mainGrid}>
        <section style={styles.controlsColumn}>
          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTag}>Chart Runtime</span>
              <h3 style={styles.panelTitle}>Chart-surface colors</h3>
              <p style={styles.panelText}>
                These tokens style the chart itself: candles, axes, grid, crosshair, and default
                drawing-tool colors.
              </p>
            </div>

            <div style={styles.controlGrid}>
              {chartColorControls.map((control) => (
                <ColorControlRow
                  key={control.key}
                  label={control.label}
                  description={control.description}
                  value={chartColors[control.key]}
                  onChange={(value) => handleChartColorChange(control.key, value)}
                />
              ))}
            </div>
          </div>

          <div style={styles.controlPanel}>
            <div style={styles.panelHeader}>
              <span style={styles.panelTag}>React UI</span>
              <h3 style={styles.panelTitle}>Toolbar and menu colors</h3>
              <p style={styles.panelText}>
                These tokens style the embedded React UI layer: toolbar, left menu, dialogs,
                inputs, borders, and control surfaces.
              </p>
            </div>

            <div style={styles.controlGrid}>
              {uiColorControls.map((control) => (
                <ColorControlRow
                  key={control.key}
                  label={control.label}
                  description={control.description}
                  value={uiColors[control.key]}
                  onChange={(value) => handleUiColorChange(control.key, value)}
                />
              ))}
            </div>
          </div>
        </section>

        <section style={styles.previewColumn}>
          <div style={styles.previewPanel}>
            <div style={styles.previewHeader}>
              <div>
                <span style={styles.eyebrow}>Live preview</span>
                <h3 style={styles.previewTitle}>Chart + React UI embedded</h3>
              </div>
              <div style={styles.previewMetaRow}>
                <span style={styles.metaChip}>{themeVariant} variant</span>
                <span style={styles.metaChip}>BTC/USD fixture</span>
              </div>
            </div>

            {previewError ? <div style={styles.errorBox}>{previewError}</div> : null}

            <div style={{ ...styles.previewShell, background: chartColors.background }}>
              {ChartUIPreview ? (
                <ChartUIPreview chart={chart} theme={activeUiTheme}>
                  <div ref={containerRef} style={styles.chartCanvas} />
                </ChartUIPreview>
              ) : (
                <div style={styles.loadingBox}>Loading preview UI…</div>
              )}
            </div>
          </div>

          <div style={styles.codePanel}>
            <div style={styles.codeHeader}>
              <div>
                <span style={styles.eyebrow}>Copy code</span>
                <h3 style={styles.previewTitle}>Generated theme objects</h3>
              </div>
              <span style={styles.copyStatus}>{copiedLabel ? `${copiedLabel} copied` : ""}</span>
            </div>

            <CodeCard
              title="Chart runtime theme"
              description="Pass this into createChart({ theme, themeVariant }) to switch between the light and dark variants."
              code={runtimeThemeCode}
              onCopy={() => copyText("Chart theme", runtimeThemeCode)}
            />

            <CodeCard
              title="React UI themes"
              description="Pick uiThemes[themeVariant] and pass that active entry into the ChartUI theme prop."
              code={uiThemeCode}
              onCopy={() => copyText("UI themes", uiThemeCode)}
            />

            <CodeCard
              title="Apply snippet"
              description="Copy the full example when you want the runtime theme and the React UI wrapper wired together."
              code={applyCode}
              onCopy={() => copyText("Apply snippet", applyCode)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ColorControlRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label style={styles.controlRow}>
      <div style={styles.controlCopy}>
        <span style={styles.controlTitle}>{label}</span>
        <span style={styles.controlDescription}>{description}</span>
      </div>

      <div style={styles.controlInputs}>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={styles.colorPicker}
          aria-label={label}
        />

        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          style={styles.colorValueInput}
          spellCheck={false}
        />
      </div>
    </label>
  );
}

function CodeCard({
  title,
  description,
  code,
  onCopy,
}: {
  title: string;
  description: string;
  code: string;
  onCopy: () => void;
}) {
  return (
    <div style={styles.codeCard}>
      <div style={styles.codeCardHeader}>
        <div>
          <h4 style={styles.codeCardTitle}>{title}</h4>
          <p style={styles.codeCardDescription}>{description}</p>
        </div>

        <button type="button" onClick={onCopy} style={styles.copyButton}>
          Copy
        </button>
      </div>

      <pre style={styles.codeBlock}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "grid",
    gap: 24,
  },
  presetSection: {
    display: "grid",
    gap: 16,
    padding: 24,
    borderRadius: 24,
    border: "1px solid var(--doc-border)",
    background:
      "linear-gradient(145deg, rgba(7, 10, 18, 0.98) 0%, rgba(18, 25, 40, 0.92) 55%, rgba(9, 16, 29, 0.96) 100%)",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--doc-text-secondary)",
  },
  sectionTitle: {
    margin: 0,
    color: "#F7FBFF",
    fontSize: 28,
    lineHeight: 1.1,
  },
  sectionText: {
    margin: "10px 0 0",
    maxWidth: 720,
    color: "#C5D7ED",
    fontSize: 15,
    lineHeight: 1.7,
  },
  presetRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  variantSection: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  variantLabel: {
    color: "#C5D7ED",
    fontSize: 13,
    fontWeight: 600,
  },
  variantButtons: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 10,
    padding: 6,
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.05)",
  },
  variantButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid transparent",
    background: "transparent",
    color: "#D7E6F5",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  activeVariantButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "#F7FBFF",
    color: "#09111D",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  presetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    background: "rgba(255, 255, 255, 0.04)",
    color: "#F7FBFF",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  activePresetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "#F7FBFF",
    color: "#09111D",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
  },
  presetSwatch: {
    width: 18,
    height: 18,
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.2)",
  },
  mainGrid: {
    display: "grid",
    gap: 24,
    gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)",
  },
  controlsColumn: {
    display: "grid",
    gap: 20,
    alignContent: "start",
  },
  previewColumn: {
    display: "grid",
    gap: 20,
    alignContent: "start",
  },
  controlPanel: {
    display: "grid",
    gap: 18,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  panelHeader: {
    display: "grid",
    gap: 8,
  },
  panelTag: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(30, 161, 205, 0.12)",
    border: "1px solid rgba(30, 161, 205, 0.24)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  panelTitle: {
    margin: 0,
    fontSize: 22,
    color: "var(--doc-text)",
  },
  panelText: {
    margin: 0,
    color: "var(--doc-text-secondary)",
    fontSize: 14,
    lineHeight: 1.65,
  },
  controlGrid: {
    display: "grid",
    gap: 12,
  },
  controlRow: {
    display: "grid",
    gap: 12,
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.03)",
  },
  controlCopy: {
    display: "grid",
    gap: 4,
  },
  controlTitle: {
    color: "var(--doc-text)",
    fontSize: 14,
    fontWeight: 700,
  },
  controlDescription: {
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  controlInputs: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  colorPicker: {
    width: 42,
    height: 42,
    padding: 0,
    border: "none",
    borderRadius: 10,
    background: "transparent",
    cursor: "pointer",
  },
  colorValueInput: {
    width: 110,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--doc-border)",
    background: "rgba(5, 5, 5, 0.84)",
    color: "#F7FBFF",
    fontSize: 13,
    fontFamily: "var(--ifm-font-family-monospace)",
  },
  previewPanel: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  previewHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
  },
  previewTitle: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 22,
  },
  previewMetaRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  metaChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(240, 180, 41, 0.12)",
    border: "1px solid rgba(240, 180, 41, 0.22)",
    color: "var(--doc-text)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  previewShell: {
    minHeight: 540,
    height: 540,
    overflow: "hidden",
    borderRadius: 24,
    border: "1px solid var(--doc-border)",
    background: "#05070D",
    position: "relative",
  },
  chartCanvas: {
    width: "100%",
    height: "100%",
    minHeight: 540,
    position: "relative",
  },
  loadingBox: {
    display: "grid",
    placeItems: "center",
    width: "100%",
    height: "100%",
    color: "var(--doc-text-secondary)",
    fontSize: 14,
  },
  errorBox: {
    padding: "14px 16px",
    borderRadius: 16,
    border: "1px solid rgba(209, 46, 89, 0.28)",
    background: "rgba(209, 46, 89, 0.08)",
    color: "var(--doc-text)",
    fontSize: 14,
  },
  codePanel: {
    display: "grid",
    gap: 16,
    padding: 22,
    borderRadius: 22,
    border: "1px solid var(--doc-border)",
    background: "var(--doc-surface-elevated)",
  },
  codeHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  copyStatus: {
    minHeight: 18,
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    fontWeight: 600,
  },
  codeCard: {
    display: "grid",
    gap: 12,
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255, 255, 255, 0.08)",
    background: "rgba(255, 255, 255, 0.02)",
  },
  codeCardHeader: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  codeCardTitle: {
    margin: 0,
    color: "var(--doc-text)",
    fontSize: 16,
  },
  codeCardDescription: {
    margin: "4px 0 0",
    color: "var(--doc-text-secondary)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  copyButton: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid var(--doc-border)",
    background: "transparent",
    color: "var(--doc-text)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  codeBlock: {
    margin: 0,
    padding: 16,
    borderRadius: 16,
    overflowX: "auto",
    background: "#06101A",
    color: "#D7F0FF",
    fontSize: 13,
    lineHeight: 1.6,
    fontFamily: "var(--ifm-font-family-monospace)",
  },
};