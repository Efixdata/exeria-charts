import FUSION from "./fusion";
import { resolveDrawingDisplayLabel } from "./drawingToolLabels";
import { getCatalogTypeForScriptKey } from "./locale/catalogTranslator";
import { Shape } from "./Objects2";
import LIB from "./utils/chartingCommons";
import WEBRCP from "./WebRCP";
import defaultTheme from "./themes/swipper";
import { resolveChartTipThemeColors } from "./utils/chartThemeColors";
import type { ChartTheme, DrawMode } from "./types";
import type { CoreChartPanel } from "./internal-types/chart";
import type { ChartPanelObject, ChartRuntimeObject } from "./internal-types/objects";
import type { ScriptModelConfig } from "./internal-types/scripts";

export type ChartGridMode = "both" | "horizontal" | "vertical" | "none";
export type ChartGridLineStyle = "solid" | "dashed";
export type ChartVolumeColorMode = "candle" | "single";
export type ChartLineFillMode = "solid" | "gradient";

export interface ChartAppearanceSettings {
  backgroundColor: string;
  gridColor: string;
  chartLineColor: string;
  chartFillColor: string;
  chartLineFillVisible: boolean;
  chartLineFillMode: ChartLineFillMode;
  chartFillGradientColor: string;
  chartFillGradientOpacity: number;
  candleUpColor: string;
  candleDownColor: string;
  candleUpStrokeColor: string;
  candleDownStrokeColor: string;
  axisTextColor: string;
  axisBackgroundColor: string;
  crosshairColor: string;
  gridMode: ChartGridMode;
  gridVisible: boolean;
  gridLineStyle: ChartGridLineStyle;
  lastPriceLineVisible: boolean;
  lastPriceLabelVisible: boolean;
}

export interface ChartVolumeSettings {
  available: boolean;
  scriptId?: string | number;
  visible: boolean;
  opacity: number;
  colorMode: ChartVolumeColorMode;
  color: string;
}

export interface ChartIndicatorSettingsItem {
  scriptId: string | number;
  key: string;
  title: string;
  visible: boolean;
  priceTagVisible: boolean;
}

export interface ChartStrategySettingsItem {
  scriptId: string | number;
  key: string;
  title: string;
  visible: boolean;
}

export interface ChartFunctionSettingsItem {
  scriptId: string | number;
  key: string;
  title: string;
  visible: boolean;
  priceTagVisible: boolean;
}

export interface ChartDrawingSettingsItem {
  objectId: string | number;
  label: string;
  visible: boolean;
}

export type ChartInstrumentSymbolAppearance = Pick<
  ChartAppearanceSettings,
  | "chartFillColor"
  | "chartLineFillVisible"
  | "chartLineFillMode"
  | "chartFillGradientColor"
  | "chartFillGradientOpacity"
  | "candleUpColor"
  | "candleDownColor"
  | "candleUpStrokeColor"
  | "candleDownStrokeColor"
>;

export interface ChartInstrumentSettingsItem extends ChartInstrumentSymbolAppearance {
  seriesId: string;
  symbol: string;
  drawMode: DrawMode;
  lineColor: string;
  lineDash: number[];
}

export interface ChartSettingsTemplate {
  version: 1;
  name?: string;
  appearance: ChartAppearanceSettings;
  volume: ChartVolumeSettings | null;
  theme?: ChartTheme;
}

type ThemeVariantName = "dark" | "light";

const GRID_DASH_DASHED = [4, 4];

interface ChartSettingsHost {
  model: {
    mainSeries: string;
    panels: CoreChartPanel[];
    scripts: ScriptModelConfig[];
    instrumentsSeries: Array<{
      seriesId: string;
      title?: string;
      instrument?: { symbol?: string; name?: string };
    }>;
  };
  renderer: {
    objects: Record<string, unknown>;
  };
  translate(text: string): string;
  translateCatalog?(text: string, catalogType?: string): string;
  getScripts(): Record<string, { title?: string; type?: string }>;
  rerender(): void;
  objectsManager: {
    detachScript(scriptId: string | number): void;
  };
  onDelete(objectId?: string | number): void;
}

function getThemeVariant(): ThemeVariantName {
  const variant = (WEBRCP.utils.colorManager as { variant?: string }).variant;
  return variant === "light" ? "light" : "dark";
}

function parseHexRgb(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();

  if (trimmed.startsWith("#")) {
    const normalized =
      trimmed.length === 4
        ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
        : trimmed;
    const hex = normalized.slice(1);

    if (hex.length !== 6) {
      return null;
    }

    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbaMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbaMatch) {
    return {
      r: Number(rgbaMatch[1]),
      g: Number(rgbaMatch[2]),
      b: Number(rgbaMatch[3]),
    };
  }

  return null;
}

function getRelativeLuminance(color: string): number | null {
  const rgb = parseHexRgb(color);
  if (!rgb) {
    return null;
  }

  return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
}

export function isLightChartColor(color: string): boolean {
  const luminance = getRelativeLuminance(color);
  if (luminance == null) {
    return false;
  }

  return luminance >= 160;
}

export function resolveChartThemeVariant(backgroundColor: string): ThemeVariantName {
  return isLightChartColor(backgroundColor) ? "light" : "dark";
}

function getMainPanel(chart: ChartSettingsHost): CoreChartPanel {
  return (
    chart.model.panels.find((panel) => (panel as { main?: boolean }).main) ?? chart.model.panels[0]
  );
}

function getMainSeriesObject(chart: ChartSettingsHost): ChartRuntimeObject | undefined {
  return getInstrumentSeriesPlotter(chart, chart.model.mainSeries);
}

function getInstrumentSeriesPlotter(
  chart: ChartSettingsHost,
  seriesId: string,
): ChartRuntimeObject | undefined {
  const panel = getMainPanel(chart);
  return panel.objects.find(
    (object) =>
      object.type === "SeriesObject" &&
      (object.id === seriesId || object.dataLink === seriesId) &&
      chart.model.instrumentsSeries.some((entry) => entry.seriesId === seriesId),
  ) as ChartRuntimeObject | undefined;
}

function getInstrumentSymbol(
  instrumentSeries: ChartSettingsHost["model"]["instrumentsSeries"][number],
): string {
  return (
    instrumentSeries.instrument?.symbol ||
    instrumentSeries.title ||
    instrumentSeries.seriesId
  );
}

export function gridModeFromPanel(hGrid: boolean, vGrid: boolean): ChartGridMode {
  if (hGrid && vGrid) return "both";
  if (hGrid) return "horizontal";
  if (vGrid) return "vertical";
  return "none";
}

export function gridLineStyleFromDash(gridDash: unknown): ChartGridLineStyle {
  return Array.isArray(gridDash) && gridDash.length > 0 ? "dashed" : "solid";
}

export function gridDashFromLineStyle(style: ChartGridLineStyle): number[] {
  return style === "dashed" ? [...GRID_DASH_DASHED] : [];
}

export function applyGridModeToPanel(panel: CoreChartPanel, mode: ChartGridMode): void {
  switch (mode) {
    case "both":
      panel.hGrid = true;
      panel.vGrid = true;
      break;
    case "horizontal":
      panel.hGrid = true;
      panel.vGrid = false;
      break;
    case "vertical":
      panel.hGrid = false;
      panel.vGrid = true;
      break;
    case "none":
      panel.hGrid = false;
      panel.vGrid = false;
      break;
  }
}

function applyGridDashToAllPanels(chart: ChartSettingsHost, style: ChartGridLineStyle): void {
  const gridDash = gridDashFromLineStyle(style);
  for (const panel of chart.model.panels) {
    panel.gridDash = gridDash;
  }
}

export function isShapeObject(chart: ChartSettingsHost, object: ChartPanelObject): boolean {
  const type = object.type || "";
  if (!type || type === "SeriesObject" || type === "IndicatorObject" || type === "StrategyObject") {
    return false;
  }

  const rendererObject = chart.renderer.objects[type];
  return rendererObject != null && rendererObject instanceof Shape;
}

function isIndicatorScript(script: ScriptModelConfig): boolean {
  const scriptKey = script.key;
  if (typeof scriptKey !== "string" || scriptKey === "VOLUME" || scriptKey === "OBJECT") {
    return false;
  }

  if (script.permHide) {
    return false;
  }

  const proto = FUSION.getScript(scriptKey) as { type?: string; hidden?: boolean } | undefined;
  return proto?.type === "indicators" && proto.hidden !== true;
}

function isStrategyScript(script: ScriptModelConfig): boolean {
  const scriptKey = script.key;
  if (typeof scriptKey !== "string") {
    return false;
  }

  if (script.permHide) {
    return false;
  }

  const proto = FUSION.getScript(scriptKey) as { type?: string; hidden?: boolean } | undefined;
  return proto?.type === "strategies" && proto.hidden !== true;
}

function isFunctionScript(script: ScriptModelConfig): boolean {
  const scriptKey = script.key;
  if (typeof scriptKey !== "string") {
    return false;
  }

  if (script.permHide) {
    return false;
  }

  const proto = FUSION.getScript(scriptKey) as { type?: string; hidden?: boolean } | undefined;
  return proto?.type === "functions" && proto.hidden !== true;
}

function getScriptTitle(chart: ChartSettingsHost, script: ScriptModelConfig): string {
  const scriptKey = String(script.key || "");
  const catalogEntry = FUSION.getFreeScripts()[scriptKey];
  const title = catalogEntry?.title || script.userName || scriptKey;
  const catalogType = getCatalogTypeForScriptKey(scriptKey);

  if (chart.translateCatalog) {
    return chart.translateCatalog(String(title), catalogType);
  }

  return chart.translate(String(title));
}

function getPlottersForScript(chart: ChartSettingsHost, scriptId: string | number): ChartRuntimeObject[] {
  return LIB.getPlottersForScriptByScriptId(chart.model, scriptId) as ChartRuntimeObject[];
}

function findVolumeScript(chart: ChartSettingsHost): ScriptModelConfig | undefined {
  return chart.model.scripts.find((script) => script.key === "VOLUME" && script.id);
}

function findVolumePlotter(chart: ChartSettingsHost): ChartRuntimeObject | undefined {
  const script = findVolumeScript(chart);
  if (!script?.id) {
    return undefined;
  }

  const plotters = getPlottersForScript(chart, script.id);
  return (
    plotters.find((plotter) => plotter.renderAs === "Volume Histogram") ?? plotters[0]
  );
}

function patchThemeColor(
  token: string,
  color: string,
  variant: ThemeVariantName,
  storedTheme?: ChartTheme,
): ChartTheme {
  const theme = storedTheme
    ? (JSON.parse(JSON.stringify(storedTheme)) as ChartTheme)
    : (JSON.parse(JSON.stringify(defaultTheme)) as ChartTheme);

  const colors = (theme.colors ?? {}) as Record<string, Partial<Record<ThemeVariantName, string>>>;
  colors[token] = {
    ...(colors[token] ?? {}),
    [variant]: color,
  };
  theme.colors = colors;

  return theme;
}

export function getChartAppearanceSettings(
  chart: ChartSettingsHost,
  storedTheme?: ChartTheme,
): ChartAppearanceSettings {
  const colorManager = WEBRCP.utils.colorManager;
  const panel = getMainPanel(chart);
  const mainSeries = getMainSeriesObject(chart);
  const gridMode = gridModeFromPanel(!!panel.hGrid, !!panel.vGrid);

  return {
    backgroundColor: colorManager.getColor("backgroundColor"),
    gridColor: colorManager.getColor("gridColor"),
    chartLineColor: colorManager.getColor(
      typeof mainSeries?.color === "string" ? mainSeries.color : "chartLine",
      "chartLine",
    ),
    chartFillColor: colorManager.getColor("chartFill"),
    chartLineFillVisible: mainSeries?.lineFillVisible === true,
    chartLineFillMode:
      mainSeries?.lineFillMode === "gradient" ? "gradient" : "solid",
    chartFillGradientColor: colorManager.getColor(
      "chartFillGradient",
      "chartLine",
    ),
    chartFillGradientOpacity:
      typeof mainSeries?.lineFillGradientOpacity === "number"
        ? mainSeries.lineFillGradientOpacity
        : 0.4,
    candleUpColor: colorManager.getColor("chartGreen"),
    candleDownColor: colorManager.getColor("chartRed"),
    candleUpStrokeColor: colorManager.getColor("chartGreenStroke"),
    candleDownStrokeColor: colorManager.getColor("chartRedStroke"),
    axisTextColor: colorManager.getColor("priceAxisTextColor"),
    axisBackgroundColor: colorManager.getColor("priceAxisBackground"),
    crosshairColor: colorManager.getColor("crosshairColor"),
    gridMode,
    gridVisible: gridMode !== "none",
    gridLineStyle: gridLineStyleFromDash(panel.gridDash),
    lastPriceLineVisible: mainSeries?.priceLine === true,
    lastPriceLabelVisible: mainSeries?.priceTag === true,
  };
}

export function applyChartAppearanceSettings(
  chart: ChartSettingsHost,
  settings: ChartAppearanceSettings,
  storedTheme?: ChartTheme,
): ChartTheme {
  let theme = storedTheme ? (JSON.parse(JSON.stringify(storedTheme)) as ChartTheme) : undefined;
  const variant = resolveChartThemeVariant(settings.backgroundColor);
  const isLight = variant === "light";
  const primaryText = settings.axisTextColor;
  const mutedText = isLight ? "#787B86" : "rgba(255, 255, 255, 0.65)";
  const handlerColor = isLight ? "rgba(19, 23, 34, 0.12)" : "rgba(255, 255, 255, 0.1)";
  const crosshairLabelText = isLight ? "#FFFFFF" : "#FFFFFF";

  const patch = (token: string, color: string) => {
    theme = patchThemeColor(token, color, variant, theme);
  };

  patch("backgroundColor", settings.backgroundColor);
  patch("gridColor", settings.gridColor);
  patch("chartLine", settings.chartLineColor);
  patch("chartStroke", settings.chartLineColor);
  patch("chartFill", settings.chartFillColor);
  patch("chartFillGradient", settings.chartFillGradientColor);
  patch("chartGreen", settings.candleUpColor);
  patch("chartGreenStroke", settings.candleUpStrokeColor);
  patch("chartRed", settings.candleDownColor);
  patch("chartRedStroke", settings.candleDownStrokeColor);
  patch("priceAxisTextColor", settings.axisTextColor);
  patch("timeAxisTextColor", settings.axisTextColor);
  patch("priceAxisBackground", settings.axisBackgroundColor);
  patch("timeAxisBackground", settings.axisBackgroundColor);
  patch("crosshairColor", settings.crosshairColor);
  patch("crosshairTextColor", crosshairLabelText);
  patch("crosshairInnerColor", settings.backgroundColor);
  patch("crosshairInnerTextColor", primaryText);
  patch("primaryTextColor", primaryText);
  patch("disabledTextColor", mutedText);
  patch("iconColor", settings.axisTextColor);
  patch("defaultToolColor", settings.chartLineColor);
  patch("defaultToolTextColor", settings.axisTextColor);
  patch("handlerColor", handlerColor);
  patch("legendLabelColor", mutedText);
  patch("legendValueColor", primaryText);
  patch("legendLineBackground", "transparent");

  const tipColors = resolveChartTipThemeColors({
    backgroundColor: settings.backgroundColor,
    axisTextColor: settings.axisTextColor,
    crosshairColor: settings.crosshairColor,
    gridColor: settings.gridColor,
    isLight,
  });

  patch("tipBackground", tipColors.tipBackground);
  patch("tipTextColor", tipColors.tipTextColor);
  patch("tipTitleColor", tipColors.tipTitleColor);
  patch("tipLabelColor", tipColors.tipLabelColor);
  patch("tipUnderline", tipColors.tipUnderline);
  patch("tipBorder", tipColors.tipBorder);
  patch("tipShadow", tipColors.tipShadow);

  WEBRCP.utils.colorManager.setTheme(theme!, variant);

  const mainSeries = getMainSeriesObject(chart);
  if (mainSeries) {
    mainSeries.color = settings.chartLineColor;
    mainSeries.strokeStyle = settings.chartLineColor;
    mainSeries.priceLine = settings.lastPriceLineVisible;
    mainSeries.priceTag = settings.lastPriceLabelVisible;
    mainSeries.lineFillVisible = settings.chartLineFillVisible;
    mainSeries.lineFillMode = settings.chartLineFillMode;
    mainSeries.lineFillGradientOpacity = settings.chartFillGradientOpacity;
  }

  const panel = getMainPanel(chart);
  if (settings.gridVisible) {
    const mode = settings.gridMode === "none" ? "both" : settings.gridMode;
    applyGridModeToPanel(panel, mode);
  } else {
    applyGridModeToPanel(panel, "none");
  }

  applyGridDashToAllPanels(chart, settings.gridLineStyle);

  chart.rerender();
  return theme!;
}

export function applyChartTheme(
  chart: ChartSettingsHost,
  theme: ChartTheme,
  variant?: string,
): ChartTheme {
  const resolvedVariant =
    variant === "light" || variant === "dark"
      ? variant
      : WEBRCP.utils.colorManager.variant;

  WEBRCP.utils.colorManager.setTheme(theme, resolvedVariant);

  const mainSeries = getMainSeriesObject(chart);
  if (mainSeries) {
    const stroke = WEBRCP.utils.colorManager.getColor("chartStroke", "chartLine");
    mainSeries.color = stroke;
    mainSeries.strokeStyle = stroke;
  }

  chart.rerender();
  return theme;
}

export function getChartVolumeSettings(chart: ChartSettingsHost): ChartVolumeSettings {
  const script = findVolumeScript(chart);
  const plotter = findVolumePlotter(chart);

  if (!script?.id || !plotter) {
    return {
      available: false,
      visible: false,
      opacity: 0.2,
      colorMode: "candle",
      color: "#f44336",
    };
  }

  const plotters = getPlottersForScript(chart, script.id);
  const visible =
    script.visible !== false && plotters.length > 0
      ? plotters.every((entry) => !entry.hidden)
      : script.visible !== false;

  const opacity =
    typeof plotter.volumeOpacity === "number"
      ? Math.min(1, Math.max(0, plotter.volumeOpacity))
      : 0.2;

  return {
    available: true,
    scriptId: script.id,
    visible,
    opacity,
    colorMode: plotter.volumeColorMode === "single" ? "single" : "candle",
    color: typeof plotter.color === "string" ? plotter.color : "#f44336",
  };
}

export function applyChartVolumeSettings(
  chart: ChartSettingsHost,
  settings: ChartVolumeSettings,
): void {
  if (!settings.available || settings.scriptId == null) {
    return;
  }

  const script = chart.model.scripts.find((entry) => entry.id === settings.scriptId);
  if (!script) {
    return;
  }

  script.visible = settings.visible;

  const hidden = !settings.visible;
  for (const plotter of getPlottersForScript(chart, settings.scriptId)) {
    plotter.hidden = hidden;
    plotter.volumeOpacity = Math.min(1, Math.max(0, settings.opacity));
    plotter.volumeColorMode = settings.colorMode;
    if (settings.colorMode === "single") {
      plotter.color = settings.color;
    }
  }

  chart.rerender();
}

export function getChartIndicatorSettings(chart: ChartSettingsHost): ChartIndicatorSettingsItem[] {
  const items: ChartIndicatorSettingsItem[] = [];

  for (const script of chart.model.scripts) {
    if (!script.id || !isIndicatorScript(script)) {
      continue;
    }

    const plotters = getPlottersForScript(chart, script.id);
    const visible =
      script.visible !== false && plotters.length > 0
        ? plotters.every((plotter) => !plotter.hidden)
        : script.visible !== false;

    items.push({
      scriptId: script.id,
      key: String(script.key || ""),
      title: getScriptTitle(chart, script),
      visible,
      priceTagVisible: plotters.some((plotter) => plotter.priceTag === true),
    });
  }

  return items;
}

export function getChartStrategySettings(chart: ChartSettingsHost): ChartStrategySettingsItem[] {
  const items: ChartStrategySettingsItem[] = [];

  for (const script of chart.model.scripts) {
    if (!script.id || !isStrategyScript(script)) {
      continue;
    }

    const plotters = getPlottersForScript(chart, script.id);
    const visible =
      script.visible !== false && plotters.length > 0
        ? plotters.every((plotter) => !plotter.hidden)
        : script.visible !== false;

    items.push({
      scriptId: script.id,
      key: String(script.key || ""),
      title: getScriptTitle(chart, script),
      visible,
    });
  }

  return items;
}

export function getChartFunctionSettings(chart: ChartSettingsHost): ChartFunctionSettingsItem[] {
  const items: ChartFunctionSettingsItem[] = [];

  for (const script of chart.model.scripts) {
    if (!script.id || !isFunctionScript(script)) {
      continue;
    }

    const plotters = getPlottersForScript(chart, script.id);
    const visible =
      script.visible !== false && plotters.length > 0
        ? plotters.every((plotter) => !plotter.hidden)
        : script.visible !== false;

    items.push({
      scriptId: script.id,
      key: String(script.key || ""),
      title: getScriptTitle(chart, script),
      visible,
      priceTagVisible: plotters.some((plotter) => plotter.priceTag === true),
    });
  }

  return items;
}

export function setChartIndicatorVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  setScriptVisibility(chart, scriptId, visible);
}

export function setChartStrategyVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  setScriptVisibility(chart, scriptId, visible);
}

export function setChartFunctionVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  setScriptVisibility(chart, scriptId, visible);
}

function setScriptVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  let script: ScriptModelConfig | undefined;

  for (const candidate of chart.model.scripts) {
    if (candidate.id === scriptId) {
      script = candidate;
      break;
    }
  }

  if (!script || script.permHide) {
    return;
  }

  script.visible = visible;

  const hidden = !visible;
  for (const plotter of getPlottersForScript(chart, scriptId)) {
    if (plotter.permHide) {
      plotter.hidden = true;
      continue;
    }

    plotter.hidden = hidden;
  }

  chart.rerender();
}

export function setChartIndicatorPriceTagVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  const plotters = getPlottersForScript(chart, scriptId);

  for (const plotter of plotters) {
    plotter.priceTag = visible;
    plotter.priceLine = visible;
  }

  chart.rerender();
}

export function getChartIndicatorLocked(
  chart: ChartSettingsHost,
  scriptId: string | number,
): boolean {
  const script = chart.model.scripts.find((entry) => entry.id === scriptId);
  return script?.locked === true;
}

export function setChartIndicatorLocked(
  chart: ChartSettingsHost,
  scriptId: string | number,
  locked: boolean,
): void {
  const script = chart.model.scripts.find((entry) => entry.id === scriptId);

  if (!script || script.permHide) {
    return;
  }

  script.locked = locked;
  chart.rerender();
}

export function setChartFunctionPriceTagVisibility(
  chart: ChartSettingsHost,
  scriptId: string | number,
  visible: boolean,
): void {
  setChartIndicatorPriceTagVisibility(chart, scriptId, visible);
}

export function removeChartIndicator(chart: ChartSettingsHost, scriptId: string | number): void {
  chart.objectsManager.detachScript(scriptId);
  chart.rerender();
}

export function removeChartStrategy(chart: ChartSettingsHost, scriptId: string | number): void {
  chart.objectsManager.detachScript(scriptId);
  chart.rerender();
}

export function removeChartFunction(chart: ChartSettingsHost, scriptId: string | number): void {
  chart.objectsManager.detachScript(scriptId);
  chart.rerender();
}

export function getDrawingLabel(chart: ChartSettingsHost, object: ChartRuntimeObject): string {
  return resolveDrawingDisplayLabel(object, chart.translate.bind(chart));
}

export function getChartDrawingSettings(chart: ChartSettingsHost): ChartDrawingSettingsItem[] {
  const items: ChartDrawingSettingsItem[] = [];

  for (const panel of chart.model.panels) {
    for (const object of panel.objects) {
      if (!isShapeObject(chart, object)) {
        continue;
      }

      items.push({
        objectId: object.id!,
        label: getDrawingLabel(chart, object as ChartRuntimeObject),
        visible: !object.hidden,
      });
    }
  }

  return items;
}

export function setChartDrawingVisibility(
  chart: ChartSettingsHost,
  objectId: string | number,
  visible: boolean,
): void {
  for (const panel of chart.model.panels) {
    for (const object of panel.objects) {
      if (object.id === objectId) {
        object.hidden = !visible;
        chart.rerender();
        return;
      }
    }
  }
}

export function removeChartDrawing(chart: ChartSettingsHost, objectId: string | number): void {
  chart.onDelete(objectId);
}

function readInstrumentSymbolAppearance(plotter: ChartRuntimeObject): ChartInstrumentSymbolAppearance {
  const colorManager = WEBRCP.utils.colorManager;

  return {
    chartFillColor:
      typeof plotter.fillColor === "string"
        ? plotter.fillColor
        : colorManager.getColor("chartFill"),
    chartLineFillVisible: plotter.lineFillVisible === true,
    chartLineFillMode: plotter.lineFillMode === "gradient" ? "gradient" : "solid",
    chartFillGradientColor:
      typeof plotter.fillGradientColor === "string"
        ? plotter.fillGradientColor
        : colorManager.getColor("chartFillGradient", "chartLine"),
    chartFillGradientOpacity:
      typeof plotter.lineFillGradientOpacity === "number"
        ? plotter.lineFillGradientOpacity
        : 0.4,
    candleUpColor:
      typeof plotter.candleUpColor === "string"
        ? plotter.candleUpColor
        : colorManager.getColor("chartGreen"),
    candleDownColor:
      typeof plotter.candleDownColor === "string"
        ? plotter.candleDownColor
        : colorManager.getColor("chartRed"),
    candleUpStrokeColor:
      typeof plotter.candleUpStrokeColor === "string"
        ? plotter.candleUpStrokeColor
        : colorManager.getColor("chartGreenStroke"),
    candleDownStrokeColor:
      typeof plotter.candleDownStrokeColor === "string"
        ? plotter.candleDownStrokeColor
        : colorManager.getColor("chartRedStroke"),
  };
}

function writeInstrumentSymbolAppearance(
  plotter: ChartRuntimeObject,
  settings: Partial<ChartInstrumentSymbolAppearance>,
): void {
  if (settings.chartFillColor !== undefined) {
    plotter.fillColor = settings.chartFillColor;
  }
  if (settings.chartLineFillVisible !== undefined) {
    plotter.lineFillVisible = settings.chartLineFillVisible;
  }
  if (settings.chartLineFillMode !== undefined) {
    plotter.lineFillMode = settings.chartLineFillMode;
  }
  if (settings.chartFillGradientColor !== undefined) {
    plotter.fillGradientColor = settings.chartFillGradientColor;
  }
  if (settings.chartFillGradientOpacity !== undefined) {
    plotter.lineFillGradientOpacity = settings.chartFillGradientOpacity;
  }
  if (settings.candleUpColor !== undefined) {
    plotter.candleUpColor = settings.candleUpColor;
  }
  if (settings.candleDownColor !== undefined) {
    plotter.candleDownColor = settings.candleDownColor;
  }
  if (settings.candleUpStrokeColor !== undefined) {
    plotter.candleUpStrokeColor = settings.candleUpStrokeColor;
  }
  if (settings.candleDownStrokeColor !== undefined) {
    plotter.candleDownStrokeColor = settings.candleDownStrokeColor;
  }
}

export function getChartInstrumentSettings(chart: ChartSettingsHost): ChartInstrumentSettingsItem[] {
  const items: ChartInstrumentSettingsItem[] = [];

  for (let index = 1; index < chart.model.instrumentsSeries.length; index += 1) {
    const instrumentSeries = chart.model.instrumentsSeries[index];
    const plotter = getInstrumentSeriesPlotter(chart, instrumentSeries.seriesId);
    if (!plotter) {
      continue;
    }

    const lineColor =
      typeof plotter.color === "string"
        ? plotter.color
        : typeof plotter.strokeStyle === "string"
          ? plotter.strokeStyle
          : WEBRCP.utils.colorManager.getColor("chartLine");

    items.push({
      seriesId: instrumentSeries.seriesId,
      symbol: getInstrumentSymbol(instrumentSeries),
      drawMode: getInstrumentSeriesDrawMode(plotter),
      lineColor,
      lineDash: Array.isArray(plotter.dash) ? [...plotter.dash] : [],
      ...readInstrumentSymbolAppearance(plotter),
    });
  }

  return items;
}

function getInstrumentSeriesDrawMode(plotter: ChartRuntimeObject): DrawMode {
  const renderAs = plotter.renderAs;
  if (
    renderAs === "OHLC" ||
    renderAs === "Bars" ||
    renderAs === "Line" ||
    renderAs === "Histogram" ||
    renderAs === "Line and Histogram"
  ) {
    return renderAs;
  }

  return "Line";
}

export function getInstrumentDrawMode(chart: ChartSettingsHost, seriesId: string): DrawMode {
  const plotter = getInstrumentSeriesPlotter(chart, seriesId);
  if (!plotter) {
    return "OHLC";
  }

  return getInstrumentSeriesDrawMode(plotter);
}

export function applyChartInstrumentSettings(
  chart: ChartSettingsHost,
  seriesId: string,
  settings: Partial<
    Pick<ChartInstrumentSettingsItem, "lineColor" | "lineDash"> & ChartInstrumentSymbolAppearance
  >,
): void {
  const plotter = getInstrumentSeriesPlotter(chart, seriesId);
  if (!plotter) {
    return;
  }

  if (seriesId === chart.model.mainSeries) {
    chart.rerender();
    return;
  }

  if (settings.lineColor !== undefined) {
    plotter.color = settings.lineColor;
    plotter.strokeStyle = settings.lineColor;
  }

  if (settings.lineDash !== undefined) {
    plotter.dash = [...settings.lineDash];
  }

  writeInstrumentSymbolAppearance(plotter, settings);

  chart.rerender();
}

export function exportChartSettingsTemplate(
  chart: ChartSettingsHost,
  storedTheme?: ChartTheme,
  name?: string,
): ChartSettingsTemplate {
  const volume = getChartVolumeSettings(chart);

  return {
    version: 1,
    name,
    appearance: getChartAppearanceSettings(chart, storedTheme),
    volume: volume.available ? volume : null,
    theme: storedTheme ? (JSON.parse(JSON.stringify(storedTheme)) as ChartTheme) : undefined,
  };
}

export function importChartSettingsTemplate(
  chart: ChartSettingsHost,
  template: ChartSettingsTemplate,
  storedTheme?: ChartTheme,
): ChartTheme {
  let theme = storedTheme ? (JSON.parse(JSON.stringify(storedTheme)) as ChartTheme) : undefined;

  theme = applyChartAppearanceSettings(chart, template.appearance, theme);

  if (template.volume?.available) {
    applyChartVolumeSettings(chart, template.volume);
  }

  return theme!;
}
