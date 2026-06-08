import {
  CHART_SETTINGS_PRESETS,
  type ChartSettingsPreset,
} from "../../../../../packages/react-chart-ui/src/components/TopMenu/ChartSettings/chartSettingsPresets";
import type {
  ChartColorKey,
  ChartColorState,
  ThemePreset,
  ThemeVariant,
  UiColorKey,
  UiColorState,
  VariantPalette,
} from "./core";

const LIGHT_PRESET_IDS = new Set(["day", "paper"]);

function mixColors(first: string, second: string, ratio: number) {
  const parse = (hexColor: string) => {
    const normalized = hexColor.replace("#", "");
    const safeColor =
      normalized.length === 3
        ? normalized
            .split("")
            .map((value) => value + value)
            .join("")
        : normalized.slice(0, 6);

    return {
      r: Number.parseInt(safeColor.slice(0, 2), 16),
      g: Number.parseInt(safeColor.slice(2, 4), 16),
      b: Number.parseInt(safeColor.slice(4, 6), 16),
    };
  };

  const toHex = (value: number) =>
    Math.min(255, Math.max(0, Math.round(value))).toString(16).padStart(2, "0");

  const from = parse(first);
  const to = parse(second);
  const weight = Math.min(1, Math.max(0, ratio));

  return `#${toHex(from.r + (to.r - from.r) * weight)}${toHex(
    from.g + (to.g - from.g) * weight,
  )}${toHex(from.b + (to.b - from.b) * weight)}`;
}

function deriveDarkChartColors(lightColors: ChartColorState): ChartColorState {
  return {
    accent: mixColors(lightColors.accent, "#131722", 0.12),
    background: mixColors(lightColors.background, "#131722", 0.9),
    axisText: mixColors(lightColors.axisText, "#131722", 0.55),
    grid: mixColors(lightColors.grid, "#131722", 0.75),
    candleUp: mixColors(lightColors.candleUp, "#0F5132", 0.1),
    candleDown: mixColors(lightColors.candleDown, "#8A1C2F", 0.1),
    crosshair: mixColors(lightColors.crosshair, "#131722", 0.15),
    tool: mixColors(lightColors.tool, "#131722", 0.45),
  };
}

function deriveLightChartColors(darkColors: ChartColorState): ChartColorState {
  return {
    accent: mixColors(darkColors.accent, "#18324D", 0.18),
    background: mixColors(darkColors.background, "#F7FAFD", 0.95),
    axisText: mixColors(darkColors.axisText, "#25354A", 0.74),
    grid: mixColors(darkColors.grid, "#FFFFFF", 0.82),
    candleUp: mixColors(darkColors.candleUp, "#0F5132", 0.16),
    candleDown: mixColors(darkColors.candleDown, "#8A1C2F", 0.14),
    crosshair: mixColors(darkColors.crosshair, "#334155", 0.4),
    tool: mixColors(darkColors.tool, "#3A4D63", 0.58),
  };
}

function deriveDarkUiColors(lightColors: UiColorState): UiColorState {
  return {
    accent: mixColors(lightColors.accent, "#131722", 0.12),
    toolbarBackground: mixColors(lightColors.toolbarBackground, "#0C1220", 0.88),
    panel: mixColors(lightColors.panel, "#131722", 0.82),
    panelStrong: mixColors(lightColors.panelStrong, "#131722", 0.72),
    inputSurface: mixColors(lightColors.inputSurface, "#131722", 0.65),
    inputBorder: lightColors.inputBorder,
    text: mixColors(lightColors.text, "#FFFFFF", 0.08),
    mutedText: mixColors(lightColors.mutedText, "#FFFFFF", 0.35),
    divider: mixColors(lightColors.divider, "#FFFFFF", 0.45),
  };
}

function deriveLightUiColors(darkColors: UiColorState): UiColorState {
  return {
    accent: mixColors(darkColors.accent, "#18324D", 0.16),
    toolbarBackground: mixColors(darkColors.toolbarBackground, "#F7FAFD", 0.95),
    panel: mixColors(darkColors.panel, "#FFFFFF", 0.93),
    panelStrong: mixColors(darkColors.panelStrong, "#EEF4FB", 0.72),
    inputSurface: mixColors(darkColors.inputSurface, "#FFFFFF", 0.88),
    inputBorder: "1px solid #E0E3EB",
    text: "#162133",
    mutedText: "#5D718B",
    divider: mixColors(darkColors.divider, "#D7E0EB", 0.48),
  };
}

function extractChartColors(preset: ChartSettingsPreset): ChartColorState {
  const appearance = preset.template.appearance!;

  return {
    accent: appearance.chartLineColor,
    background: appearance.backgroundColor,
    axisText: appearance.axisTextColor,
    grid: appearance.gridColor,
    candleUp: appearance.candleUpColor,
    candleDown: appearance.candleDownColor,
    crosshair: appearance.crosshairColor,
    tool: appearance.chartLineColor,
  };
}

function extractUiColors(preset: ChartSettingsPreset): UiColorState {
  const ui = preset.uiTheme;

  return {
    accent: ui.accentColor ?? preset.template.appearance!.chartLineColor,
    toolbarBackground: ui.toolbar?.background ?? preset.swatches.chrome,
    panel: ui.dialog?.backgroundColor ?? preset.swatches.chrome,
    panelStrong: ui.subMenu?.background ?? ui.dialog?.backgroundColor ?? preset.swatches.chrome,
    inputSurface: ui.inputs?.backgroundColor ?? "#2A2E39",
    inputBorder: ui.border?.inner ?? "1px solid #434651",
    text: ui.dialog?.textColor ?? "#D1D4DC",
    mutedText: ui.dialog?.itemSubTitleColor ?? "rgba(255, 255, 255, 0.65)",
    divider: ui.dialog?.dividerColor ?? "rgba(255, 255, 255, 0.12)",
  };
}

function buildVariantPalette<T extends string>(
  base: Record<T, string>,
  isLightPreset: boolean,
): VariantPalette<T> {
  if (isLightPreset) {
    return {
      light: base,
      dark: deriveDarkChartColors(base as ChartColorState) as Record<T, string>,
    };
  }

  return {
    dark: base,
    light: deriveLightChartColors(base as ChartColorState) as Record<T, string>,
  };
}

function buildUiVariantPalette(base: UiColorState, isLightPreset: boolean): VariantPalette<UiColorKey> {
  if (isLightPreset) {
    return {
      light: base,
      dark: deriveDarkUiColors(base),
    };
  }

  return {
    dark: base,
    light: deriveLightUiColors(base),
  };
}

function toThemePreset(preset: ChartSettingsPreset): ThemePreset {
  const isLightPreset = LIGHT_PRESET_IDS.has(preset.id);
  const chartColors = extractChartColors(preset);
  const uiColors = extractUiColors(preset);

  return {
    id: preset.id,
    label: preset.label,
    chipLabel: preset.label.split(/\s+/)[0] ?? preset.label,
    chipColor: preset.template.appearance!.chartLineColor,
    description: preset.description,
    preferredVariant: isLightPreset ? "light" : "dark",
    swatches: preset.swatches,
    chart: buildVariantPalette<ChartColorKey>(chartColors, isLightPreset),
    ui: buildUiVariantPalette(uiColors, isLightPreset),
  };
}

export const themePresets: ThemePreset[] = CHART_SETTINGS_PRESETS.map(toThemePreset);

export function getThemePresetPreferredVariant(presetId: string): ThemeVariant {
  return themePresets.find((preset) => preset.id === presetId)?.preferredVariant ?? "dark";
}
