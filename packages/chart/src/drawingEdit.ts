import type { LegacyShapeObject } from "./objectRuntimeBases";
import { Shape } from "./Objects2";
import WEBRCP from "./WebRCP";
import type { CoreChartPanel } from "./internal-types/chart";
import type { ChartPanelObject, ChartRuntimeObject } from "./internal-types/objects";
import type { ScriptModelConfig } from "./internal-types/scripts";
import { resolveDrawingDisplayLabel } from "./drawingToolLabels";
import {
  ensureEntryAnchor,
  resolveEntryPrice,
  readPositionPnlInput,
  syncAnchorsFromPrices,
  syncPricesFromAnchors,
} from "./objects/shapes/longShortPosition";
import { computePositionPnl, type PositionRiskMode } from "./objects/shapes/positionPnl";
import { isShapeLocked, resolveShapeOpacity } from "./shapeStyle";

interface DrawingEditHost {
  model: {
    panels: CoreChartPanel[];
    scripts: ScriptModelConfig[];
  };
  renderer: {
    objects: Record<string, unknown>;
  };
  translate(text: string): string;
  rerender(): void;
}

export interface ChartDrawingEditConfig {
  objectId: string | number;
  type: string;
  label: string;
  color: string;
  dash: number[];
  width: number;
  visible: boolean;
  supportsColor: boolean;
  supportsFill: boolean;
  fillVisible: boolean;
  supportsText: boolean;
  text: string;
  fontSize: number;
  opacity: number;
  locked: boolean;
  supportsBackground: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  supportsPosition: boolean;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  profitColor: string;
  lossColor: string;
  accountSize: number;
  riskMode: PositionRiskMode;
  riskAmount: number;
  riskPercent: number;
  quantity: number;
  profitAtTarget: number;
  pnlAtStop: number;
  lossAtStop: number;
  balanceAtTarget: number;
  balanceAtStop: number;
  riskRewardRatio: number | null;
}

export interface ChartDrawingEditPatch {
  color?: string;
  dash?: number[];
  width?: number;
  visible?: boolean;
  fillVisible?: boolean;
  text?: string;
  fontSize?: number;
  opacity?: number;
  locked?: boolean;
  backgroundColor?: string;
  backgroundOpacity?: number;
  direction?: "LONG" | "SHORT";
  entryPrice?: number;
  stopPrice?: number;
  targetPrice?: number;
  profitColor?: string;
  lossColor?: string;
  accountSize?: number;
  riskMode?: PositionRiskMode;
  riskAmount?: number;
  riskPercent?: number;
  quantity?: number;
}

const FILL_SUPPORTED_TYPES = new Set([
  "parallelChannel",
  "ellipse",
  "box",
  "triangle",
  "fibonLines",
  "fibonExtension",
  "fibonChannel",
  "fibonArcs",
  "fibonCircles",
  "fixedRangeVolumeProfile",
  "regressionChannel",
  "textAnnotation",
  "brush",
]);

const BACKGROUND_SETTINGS_TYPES = new Set(["brush"]);

const TEXT_SUPPORTED_TYPES = new Set(["textAnnotation", "timeRange", "hRange", "vRange"]);
const POSITION_SUPPORTED_TYPES = new Set(["longShortPosition"]);
const COLOR_UNSUPPORTED_TYPES = new Set(["gannFan", "gannGrid", "gannBox"]);

function readPrice(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function isDrawingShapeObject(chart: DrawingEditHost, object: ChartPanelObject): boolean {
  const type = object.type || "";
  if (!type || type === "SeriesObject" || type === "IndicatorObject" || type === "StrategyObject") {
    return false;
  }

  const rendererObject = chart.renderer.objects[type];
  return rendererObject != null && rendererObject instanceof Shape;
}

function resolveObjectColor(color: unknown): string {
  if (typeof color !== "string" || color.length === 0) {
    return WEBRCP.utils.colorManager.getColor("defaultToolColor");
  }

  if (color.includes("#") || color.toLowerCase().includes("rgb")) {
    return color;
  }

  return WEBRCP.utils.colorManager.getColor(color, color);
}

function findShapeObject(
  chart: DrawingEditHost,
  objectId: string | number,
): ChartRuntimeObject | null {
  for (const panel of chart.model.panels) {
    for (const object of panel.objects) {
      if (object.id === objectId && isDrawingShapeObject(chart, object as ChartPanelObject)) {
        return object as ChartRuntimeObject;
      }
    }
  }

  return null;
}

function readDash(object: ChartRuntimeObject): number[] {
  return Array.isArray(object.dash) ? [...(object.dash as number[])] : [];
}

function readFontSize(object: ChartRuntimeObject): number {
  const raw = object.fontSize;
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 12;
}

function readBackgroundOpacity(object: ChartRuntimeObject): number {
  const raw = (object as { backgroundOpacity?: unknown }).backgroundOpacity;
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  if (!Number.isFinite(parsed)) {
    return 0.25;
  }
  return Math.min(1, Math.max(0, parsed));
}

export function getDrawingEditConfig(
  chart: DrawingEditHost,
  objectId: string | number,
): ChartDrawingEditConfig | null {
  const object = findShapeObject(chart, objectId);
  if (!object?.id || !object.type) {
    return null;
  }

  const type = String(object.type);
  const supportsFill = FILL_SUPPORTED_TYPES.has(type);
  const supportsBackground = BACKGROUND_SETTINGS_TYPES.has(type);
  const supportsColor = !COLOR_UNSUPPORTED_TYPES.has(type);
  const supportsText = TEXT_SUPPORTED_TYPES.has(type);
  const supportsPosition = POSITION_SUPPORTED_TYPES.has(type);
  if (supportsPosition) {
    const legacyObject = object as LegacyShapeObject;
    ensureEntryAnchor(legacyObject);
    syncPricesFromAnchors(legacyObject);
  }

  const stopPrice = readPrice(object.stopPrice, 0);
  const targetPrice = readPrice(object.targetPrice, 0);
  const entryPrice = supportsPosition
    ? resolveEntryPrice(object as LegacyShapeObject, stopPrice, targetPrice)
    : 0;
  const pnl = supportsPosition
    ? computePositionPnl(readPositionPnlInput(object as LegacyShapeObject))
    : null;

  return {
    objectId: object.id,
    type,
    label: supportsPosition
      ? object.direction === "SHORT"
        ? "Short position"
        : "Long position"
      : resolveDrawingDisplayLabel(object, chart.translate.bind(chart)),
    color: resolveObjectColor(object.color),
    dash: readDash(object),
    width: typeof object.width === "number" && object.width > 0 ? object.width : 1,
    visible: object.hidden !== true,
    supportsColor,
    supportsFill,
    fillVisible: supportsFill ? object.fillBg === true : false,
    supportsText,
    text: typeof object.text === "string" ? object.text : "",
    fontSize: readFontSize(object),
    opacity: resolveShapeOpacity(object),
    locked: isShapeLocked(object),
    supportsBackground,
    backgroundColor: resolveObjectColor(
      (object as { backgroundColor?: unknown }).backgroundColor ?? object.color,
    ),
    backgroundOpacity: readBackgroundOpacity(object),
    supportsPosition,
    direction: object.direction === "SHORT" ? "SHORT" : "LONG",
    entryPrice,
    stopPrice,
    targetPrice,
    profitColor: resolveObjectColor(object.profitColor ?? "chartGreen"),
    lossColor: resolveObjectColor(object.lossColor ?? "chartRed"),
    accountSize: readPrice(object.accountSize, 10000),
    riskMode: object.riskMode === "AMOUNT" ? "AMOUNT" : "PERCENT",
    riskAmount: readPrice(object.riskAmount, 100),
    riskPercent: readPrice(object.riskPercent, 1),
    quantity: pnl?.quantity ?? 0,
    profitAtTarget: pnl?.profitAtTarget ?? 0,
    pnlAtStop: pnl?.pnlAtStop ?? 0,
    lossAtStop: pnl?.lossAtStop ?? 0,
    balanceAtTarget: pnl?.balanceAtTarget ?? readPrice(object.accountSize, 10000),
    balanceAtStop: pnl?.balanceAtStop ?? readPrice(object.accountSize, 10000),
    riskRewardRatio: pnl?.riskRewardRatio ?? null,
  };
}

export function applyDrawingEditSettings(
  chart: DrawingEditHost,
  objectId: string | number,
  patch: ChartDrawingEditPatch,
): boolean {
  const object = findShapeObject(chart, objectId);
  if (!object) {
    return false;
  }

  const type = String(object.type || "");

  if (typeof patch.color === "string" && !COLOR_UNSUPPORTED_TYPES.has(type)) {
    object.color = patch.color;
  }

  if (Array.isArray(patch.dash)) {
    object.dash = [...patch.dash];
  }

  if (typeof patch.width === "number" && patch.width > 0) {
    object.width = patch.width;
  }

  if (typeof patch.visible === "boolean") {
    object.hidden = !patch.visible;
  }

  if (typeof patch.fillVisible === "boolean" && FILL_SUPPORTED_TYPES.has(type)) {
    object.fillBg = patch.fillVisible;
  }

  if (typeof patch.text === "string" && TEXT_SUPPORTED_TYPES.has(type)) {
    object.text = patch.text;
    if (type === "timeRange" || type === "textAnnotation") {
      object._textManual = true;
    }
  }

  if (patch.fontSize !== undefined && TEXT_SUPPORTED_TYPES.has(type)) {
    const nextFontSize =
      typeof patch.fontSize === "number" ? patch.fontSize : Number(patch.fontSize);
    if (Number.isFinite(nextFontSize) && nextFontSize > 0) {
      object.fontSize = nextFontSize;
    }
  }

  if (typeof patch.opacity === "number" && Number.isFinite(patch.opacity)) {
    object.opacity = Math.min(1, Math.max(0, patch.opacity));
  }

  if (typeof patch.backgroundColor === "string" && BACKGROUND_SETTINGS_TYPES.has(type)) {
    (object as { backgroundColor?: string }).backgroundColor = patch.backgroundColor;
  }

  if (typeof patch.backgroundOpacity === "number" && Number.isFinite(patch.backgroundOpacity)) {
    (object as { backgroundOpacity?: number }).backgroundOpacity = Math.min(
      1,
      Math.max(0, patch.backgroundOpacity),
    );
  }

  if (typeof patch.locked === "boolean") {
    object.locked = patch.locked;
  }

  if (POSITION_SUPPORTED_TYPES.has(type)) {
    if (patch.direction === "LONG" || patch.direction === "SHORT") {
      object.direction = patch.direction;
    }

    if (typeof patch.profitColor === "string") {
      object.profitColor = patch.profitColor;
    }

    if (typeof patch.lossColor === "string") {
      object.lossColor = patch.lossColor;
    }

    const priceLevelChanged =
      (typeof patch.stopPrice === "number" && Number.isFinite(patch.stopPrice)) ||
      (typeof patch.targetPrice === "number" && Number.isFinite(patch.targetPrice)) ||
      (typeof patch.entryPrice === "number" && Number.isFinite(patch.entryPrice));

    if (typeof patch.stopPrice === "number" && Number.isFinite(patch.stopPrice)) {
      object.stopPrice = patch.stopPrice;
    }

    if (typeof patch.targetPrice === "number" && Number.isFinite(patch.targetPrice)) {
      object.targetPrice = patch.targetPrice;
    }

    if (typeof patch.entryPrice === "number" && Number.isFinite(patch.entryPrice)) {
      object.entryPrice = patch.entryPrice;
      object._entryPriceManual = true;
    }

    if (priceLevelChanged && patch.quantity === undefined) {
      delete object.quantity;
    }

    if (typeof patch.accountSize === "number" && Number.isFinite(patch.accountSize) && patch.accountSize > 0) {
      object.accountSize = patch.accountSize;
    }

    if (patch.riskMode === "AMOUNT" || patch.riskMode === "PERCENT") {
      object.riskMode = patch.riskMode;
    }

    if (typeof patch.riskAmount === "number" && Number.isFinite(patch.riskAmount) && patch.riskAmount > 0) {
      object.riskAmount = patch.riskAmount;
    }

    if (typeof patch.riskPercent === "number" && Number.isFinite(patch.riskPercent) && patch.riskPercent > 0) {
      object.riskPercent = patch.riskPercent;
    }

    if (typeof patch.quantity === "number" && Number.isFinite(patch.quantity) && patch.quantity > 0) {
      object.quantity = patch.quantity;
    } else if (patch.quantity === 0) {
      delete object.quantity;
    }

    syncAnchorsFromPrices(object as LegacyShapeObject);
  }

  chart.rerender();
  return true;
}
