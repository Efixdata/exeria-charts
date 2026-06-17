import WEBRCP from "../../WebRCP";
import { isDrawingSnapEnabled } from "../../drawingWorkflow";
import LIB from "../../utils/chartingCommons";
import {
  between,
  drawAnchorArrow,
  drawAnchors,
  findAnchorPointForXY,
  isPointInCircle,
} from "../../utils/objects-lib";
import { Shape } from "../../objectRuntimeBases";
import type { LegacyAnchor, LegacyShapeObject } from "../../objectRuntimeBases";
import { createShapeMouseOutDelegate } from "./_delegates";
import type {
  ShapeHitArgs,
  ShapeInteractionArgs,
  ShapeLifecycleArgs,
  ShapeRenderArgs,
  ShapeRuntime,
} from "./_sharedTypes";
import {
  computePositionPnl,
  formatPnlCurrency,
  type PositionPnlInput,
  type PositionRiskMode,
} from "./positionPnl";

type PositionDirection = "LONG" | "SHORT";
type LevelRole = "stop" | "target";

/** 0 = Entry (first box corner), 1 = first drag corner, 2 = opposite level click. */
const ENTRY_ANCHOR = 0;
const BOX_CORNER_B = 1;
const OPPOSITE_LEVEL = 2;

function ensurePositionAnchors(object: LegacyShapeObject): void {
  if (!Array.isArray(object.anchors)) {
    object.anchors = [];
  }

  const defaults: LegacyAnchor[] = [
    { stamp: 0, offset: 0, value: 0, _index: 0 },
    {
      stamp: 0,
      offset: 0,
      value: 0,
      _index: 0,
      expandable: true,
      defaultDirection: "right",
    },
    {
      stamp: 0,
      offset: 0,
      value: 0,
      _index: 0,
      expandable: true,
      defaultDirection: "left",
    },
  ];

  while (object.anchors.length < 3) {
    const index = object.anchors.length;
    object.anchors.push({ ...defaults[index] });
  }

  for (let index = 0; index < 3; index += 1) {
    if (!object.anchors[index]) {
      object.anchors[index] = { ...defaults[index] };
    }
  }
}

function hasFirstBoxCommitted(object: LegacyShapeObject): boolean {
  return getPlacementStep(object) >= 1 || object._firstLevelRole != null;
}

function getPlacementStep(object: LegacyShapeObject): number {
  const step = object._placementStep;
  return typeof step === "number" && step >= 0 ? step : 2;
}

function isPlacementComplete(object: LegacyShapeObject): boolean {
  return getPlacementStep(object) >= 2;
}

function readDirection(object: LegacyShapeObject): PositionDirection {
  return object.direction === "SHORT" ? "SHORT" : "LONG";
}

function readPrice(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readRiskMode(value: unknown): PositionRiskMode {
  return value === "AMOUNT" ? "AMOUNT" : "PERCENT";
}

/** Long: above Entry → Target, below → Stop. Short: above → Stop, below → Target. */
export function classifyCornerRole(
  direction: PositionDirection,
  entryPrice: number,
  cornerPrice: number,
): LevelRole {
  const isAbove = cornerPrice > entryPrice;
  if (direction === "LONG") {
    return isAbove ? "target" : "stop";
  }
  return isAbove ? "stop" : "target";
}

function oppositeRole(role: LevelRole): LevelRole {
  return role === "stop" ? "target" : "stop";
}

function isOnOppositeSideOfEntry(
  entryPrice: number,
  firstLevelPrice: number,
  previewPrice: number,
): boolean {
  const firstAbove = firstLevelPrice > entryPrice;
  const previewAbove = previewPrice > entryPrice;
  return firstAbove !== previewAbove;
}

/** Legacy drawings with only two corner anchors. */
export function ensureEntryAnchor(object: LegacyShapeObject): void {
  if (!Array.isArray(object.anchors) || object.anchors.length >= 3) {
    return;
  }

  if (object.anchors.length < 2) {
    return;
  }

  const legacyA = object.anchors[0];
  const legacyB = object.anchors[1];
  const direction = readDirection(object);
  const valueA = readPrice(legacyA.value, 0);
  const valueB = readPrice(legacyB.value, 0);

  const stopPrice =
    direction === "LONG" ? Math.min(valueA, valueB) : Math.max(valueA, valueB);
  const targetPrice =
    direction === "LONG" ? Math.max(valueA, valueB) : Math.min(valueA, valueB);
  const entryPrice = resolveEntryPrice(object, stopPrice, targetPrice);

  object.stopPrice = stopPrice;
  object.targetPrice = targetPrice;
  object.entryPrice = entryPrice;
  object._placementStep = 2;
  object._firstLevelRole = classifyCornerRole(direction, entryPrice, valueB);

  object.anchors = [
    { ...legacyA, value: entryPrice },
    {
      ...legacyB,
      value: object._firstLevelRole === "stop" ? stopPrice : targetPrice,
    },
    {
      stamp: legacyA.stamp,
      offset: legacyA.offset ?? 0,
      value: object._firstLevelRole === "stop" ? targetPrice : stopPrice,
      _index: legacyA._index ?? 0,
      expandable: true,
      defaultDirection: "left",
    },
  ];

  tieOppositeCornerToEntryCorner(object);
}

function isEntryPriceUnset(stored: number, stopPrice: number, targetPrice: number): boolean {
  if (!Number.isFinite(stored)) {
    return true;
  }

  if (stored !== 0) {
    return false;
  }

  const span = Math.abs(targetPrice - stopPrice);
  return span > 0 && Math.abs(stopPrice) + Math.abs(targetPrice) > span;
}

export function resolveEntryPrice(
  object: LegacyShapeObject,
  stopPrice: number,
  targetPrice: number,
): number {
  const midpoint = (stopPrice + targetPrice) / 2;
  const manual = object._entryPriceManual === true;

  if (!manual) {
    return midpoint;
  }

  const stored = readPrice(object.entryPrice, NaN);
  if (isEntryPriceUnset(stored, stopPrice, targetPrice)) {
    return midpoint;
  }

  return stored;
}

/** Opposite level shares the entry-corner time (other box corner), not corner B. */
function getStopTargetAnchorIndices(object: LegacyShapeObject): {
  stop: number;
  target: number;
} {
  const firstRole = object._firstLevelRole as LevelRole | undefined;
  if (firstRole === "stop") {
    return { stop: BOX_CORNER_B, target: OPPOSITE_LEVEL };
  }
  if (firstRole === "target") {
    return { stop: OPPOSITE_LEVEL, target: BOX_CORNER_B };
  }

  if (!Array.isArray(object.anchors) || object.anchors.length < 3) {
    return { stop: BOX_CORNER_B, target: OPPOSITE_LEVEL };
  }

  const stopPrice = readPrice(object.stopPrice, 0);
  const boxPrice = readPrice(object.anchors[BOX_CORNER_B].value, 0);
  const oppositePrice = readPrice(object.anchors[OPPOSITE_LEVEL].value, 0);

  if (Math.abs(boxPrice - stopPrice) <= Math.abs(oppositePrice - stopPrice)) {
    return { stop: BOX_CORNER_B, target: OPPOSITE_LEVEL };
  }

  return { stop: OPPOSITE_LEVEL, target: BOX_CORNER_B };
}

function tieOppositeCornerToEntryCorner(object: LegacyShapeObject): void {
  if (!Array.isArray(object.anchors) || object.anchors.length < 3) {
    return;
  }

  const entryCorner = object.anchors[ENTRY_ANCHOR];
  const opposite = object.anchors[OPPOSITE_LEVEL];

  opposite._index = entryCorner._index;
  opposite.stamp = entryCorner.stamp;
  opposite.offset = entryCorner.offset ?? 0;
}

export function syncPricesFromAnchors(object: LegacyShapeObject): void {
  if (!Array.isArray(object.anchors) || object.anchors.length < 2) {
    return;
  }

  const entryPrice = readPrice(object.anchors[ENTRY_ANCHOR].value, 0);
  object.entryPrice = entryPrice;
  object._entryPriceManual = true;

  if (!isPlacementComplete(object)) {
    if (getPlacementStep(object) >= 1 && object._firstLevelRole) {
      const firstPrice = readPrice(object.anchors[BOX_CORNER_B].value, 0);
      if (object._firstLevelRole === "stop") {
        object.stopPrice = firstPrice;
      } else {
        object.targetPrice = firstPrice;
      }
    }
    return;
  }

  const firstRole = object._firstLevelRole as LevelRole | undefined;
  const firstPrice = readPrice(object.anchors[BOX_CORNER_B].value, 0);
  const oppositePrice = readPrice(object.anchors[OPPOSITE_LEVEL].value, 0);

  if (firstRole === "stop") {
    object.stopPrice = firstPrice;
    object.targetPrice = oppositePrice;
    object.anchors[BOX_CORNER_B].value = firstPrice;
    object.anchors[OPPOSITE_LEVEL].value = oppositePrice;
  } else if (firstRole === "target") {
    object.targetPrice = firstPrice;
    object.stopPrice = oppositePrice;
    object.anchors[BOX_CORNER_B].value = firstPrice;
    object.anchors[OPPOSITE_LEVEL].value = oppositePrice;
  } else {
    const direction = readDirection(object);
    object.stopPrice =
      direction === "LONG"
        ? Math.min(firstPrice, oppositePrice)
        : Math.max(firstPrice, oppositePrice);
    object.targetPrice =
      direction === "LONG"
        ? Math.max(firstPrice, oppositePrice)
        : Math.min(firstPrice, oppositePrice);
    object.anchors[BOX_CORNER_B].value = firstPrice;
    object.anchors[OPPOSITE_LEVEL].value = oppositePrice;
  }

  object.anchors[ENTRY_ANCHOR].value = entryPrice;
  tieOppositeCornerToEntryCorner(object);
}

function syncAnchorsFromPrices(object: LegacyShapeObject): void {
  if (!Array.isArray(object.anchors) || object.anchors.length < 3) {
    return;
  }

  const stopPrice = readPrice(object.stopPrice, 0);
  const targetPrice = readPrice(object.targetPrice, 0);
  const entryPrice = resolveEntryPrice(object, stopPrice, targetPrice);

  object.entryPrice = entryPrice;
  object.anchors[ENTRY_ANCHOR].value = entryPrice;

  const boxB = object.anchors[BOX_CORNER_B];
  const opposite = object.anchors[OPPOSITE_LEVEL];
  const direction = readDirection(object);
  const firstRole =
    (object._firstLevelRole as LevelRole | undefined) ??
    classifyCornerRole(direction, entryPrice, readPrice(boxB.value, entryPrice));

  if (firstRole === "stop") {
    boxB.value = stopPrice;
    opposite.value = targetPrice;
    object._firstLevelRole = "stop";
  } else {
    boxB.value = targetPrice;
    opposite.value = stopPrice;
    object._firstLevelRole = "target";
  }

  tieOppositeCornerToEntryCorner(object);
}

/** Horizontal span = first box corners (Entry + corner B). */
function getBoxHorizontalBounds(pts: Array<{ x: number }>): { leftX: number; rightX: number } {
  const xs = [pts[ENTRY_ANCHOR]?.x, pts[BOX_CORNER_B]?.x].filter((x): x is number =>
    Number.isFinite(x),
  );

  if (xs.length === 0) {
    return { leftX: 0, rightX: 8 };
  }

  const leftX = Math.min(...xs);
  const rightX = Math.max(...xs);
  return { leftX, rightX: leftX === rightX ? leftX + 8 : rightX };
}

function isPositionExpanded(object: LegacyShapeObject): boolean {
  if (object.expanded === true) {
    return true;
  }

  return (
    Array.isArray(object.anchors) &&
    object.anchors.some((anchor) => anchor?.expandable === true && anchor.expanded === true)
  );
}

function setPositionExpanded(object: LegacyShapeObject, expanded: boolean): void {
  object.expanded = expanded;

  if (!Array.isArray(object.anchors)) {
    return;
  }

  for (let index = 0; index < object.anchors.length; index += 1) {
    const anchor = object.anchors[index];
    if (anchor?.expandable === true) {
      anchor.expanded = expanded;
    }
  }
}

function getPlotRight(
  panel: ShapeRenderArgs[4],
  renderer: ShapeRenderArgs[2],
): number {
  return panel._width - renderer.getPriceRenderingOptions().valueAxisWidth;
}

function getRenderHorizontalSpan(
  object: LegacyShapeObject,
  leftX: number,
  rightX: number,
  plotRight: number,
): { leftX: number; rightX: number } {
  if (isPositionExpanded(object)) {
    return { leftX, rightX: plotRight };
  }

  return { leftX, rightX };
}

function getLevelYCoordinates(
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
): {
  entryY: number;
  stopY: number;
  targetY: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
} {
  const fV = LIB.getReferenceValue(object, model, seriesManager);
  const priceContext = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV,
  };

  const stopPrice = readPrice(object.stopPrice, 0);
  const targetPrice = readPrice(object.targetPrice, 0);
  const entryPrice = readPrice(object.entryPrice, 0);

  return {
    entryPrice,
    stopPrice,
    targetPrice,
    entryY: renderer.getYCoordinateForPrice(entryPrice, priceContext) + panel._offset,
    stopY: renderer.getYCoordinateForPrice(stopPrice, priceContext) + panel._offset,
    targetY: renderer.getYCoordinateForPrice(targetPrice, priceContext) + panel._offset,
  };
}

type LevelHandlePoint = {
  x: number;
  y: number;
  arrowY: number;
  expandable: boolean;
  expanded: boolean;
  dir: string;
  anchorIndex: number;
};

function getLevelArrowY(handle: LevelHandlePoint): number {
  return handle.arrowY;
}

function isLevelArrowVisible(
  panel: ShapeRenderArgs[4],
  handle: LevelHandlePoint,
  plotRight: number,
  margin = 32,
): boolean {
  const anchorOnScreen = between(
    panel._offset - margin,
    handle.y,
    panel._offset + panel._height + margin,
  );
  const arrowOnScreen = between(
    panel._offset - margin,
    handle.arrowY,
    panel._offset + panel._height + margin,
  );

  return (
    between(-margin, handle.x, plotRight + margin) && (anchorOnScreen || arrowOnScreen)
  );
}

function drawExpandableAnchorArrows(
  ctx: CanvasRenderingContext2D,
  panel: ShapeRenderArgs[4],
  handles: LevelHandlePoint[],
  size: number,
  distance: number,
  color: string,
  plotRight: number,
): void {
  for (const handle of handles) {
    if (!isLevelArrowVisible(panel, handle, plotRight)) {
      continue;
    }

    drawAnchorArrow(ctx, panel, handle, size, distance, color, 1);
  }
}

function syncPositionExpandedState(object: LegacyShapeObject): void {
  if (object.expanded === false) {
    setPositionExpanded(object, false);
    return;
  }

  if (object.expanded === true || isPositionExpanded(object)) {
    setPositionExpanded(object, true);
  }
}

function getLevelArrowHitTolerance(tolerance: number): number {
  return Math.max(tolerance, 12);
}

function findLevelHandleArrowForXY(
  handles: LevelHandlePoint[],
  x: number,
  y: number,
  tolerance: number,
): LevelHandlePoint | null {
  let closest: LevelHandlePoint | null = null;
  let closestDistanceSquared = Infinity;
  const hitRadius = getLevelArrowHitTolerance(tolerance);

  for (const handle of handles) {
    const arrowX = handle.x;
    const arrowY = getLevelArrowY(handle);

    if (!isPointInCircle({ x, y, r: hitRadius }, arrowX, arrowY)) {
      continue;
    }

    const dx = x - arrowX;
    const dy = y - arrowY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < closestDistanceSquared) {
      closest = handle;
      closestDistanceSquared = distanceSquared;
    }
  }

  return closest;
}

function isLevelHandleArrowHit(
  x: number,
  y: number,
  handles: LevelHandlePoint[],
  tolerance: number,
): boolean {
  return findLevelHandleArrowForXY(handles, x, y, tolerance) != null;
}

function isOverLevelHandleArrow(
  interactor: ShapeInteractionArgs[3],
  event: ShapeInteractionArgs[0],
  handle: LevelHandlePoint,
  tolerance: number,
): boolean {
  return interactor.isOver(
    event._offset.offsetX,
    event._offset.offsetY,
    handle.x,
    handle.arrowY,
    getLevelArrowHitTolerance(tolerance),
  );
}

/** Arrows at expandable anchors — same positions as Shape.renderAnchorsOverlay / getPoints. */
function buildExpandableAnchorArrowHandles(
  shape: ShapeRuntime,
  object: LegacyShapeObject,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
): LevelHandlePoint[] {
  const pts = shape.getPoints(object, renderer, panel, model, seriesManager);
  const anchors = object.anchors;
  if (!Array.isArray(anchors) || pts.length < 2) {
    return [];
  }

  const arrowDistance = shape.anchorPointDistanceToArrow;
  const expanded = isPositionExpanded(object);
  const handles: LevelHandlePoint[] = [];

  for (let index = 0; index < Math.min(anchors.length, pts.length); index += 1) {
    const anchor = anchors[index];
    if (anchor?.expandable !== true) {
      continue;
    }

    const point = pts[index];
    // Both levels expand/collapse to the right (price axis), regardless of anchor side.
    const dir = "right";

    handles.push({
      x: point.x,
      y: point.y,
      arrowY: point.y + arrowDistance,
      expandable: true,
      expanded,
      dir,
      anchorIndex: index,
    });
  }

  return handles;
}

function drawLongShortSelectionHandles(
  shape: ShapeRuntime,
  object: LegacyShapeObject,
  octx: CanvasRenderingContext2D,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
): void {
  syncPositionExpandedState(object);

  const pts = shape.getPoints(object, renderer, panel, model, seriesManager);
  if (pts.length < 2) {
    return;
  }

  const anchorStroke =
    WEBRCP.utils.colorManager.getColor("accent", shape.anchorColor) ?? shape.anchorColor;
  const anchorHover =
    WEBRCP.utils.colorManager.getColor("chartZeroColor", shape.anchorColorHover) ??
    shape.anchorColorHover;
  const plotRight = getPlotRight(panel, renderer);
  const anchorOptions = { plotRight, strokeColor: anchorStroke, hollow: true };
  const cornerPts = pts.slice(0, Math.min(pts.length, 3));
  const arrowDistance = shape.anchorPointDistanceToArrow;
  const arrowHandles = buildExpandableAnchorArrowHandles(
    shape,
    object,
    renderer,
    model,
    panel,
    seriesManager,
  );

  if (object._hitAnchor) {
    for (const point of cornerPts) {
      if (point.x === object._hitAnchor.x && point.y === object._hitAnchor.y) {
        drawAnchors(octx, panel, [point], shape.anchorPointSize + 1, anchorHover, 1, anchorOptions);
      }
    }
  }

  drawAnchors(octx, panel, cornerPts, shape.anchorPointSize, anchorStroke, 1, anchorOptions);

  drawExpandableAnchorArrows(
    octx,
    panel,
    arrowHandles,
    shape.anchorPointArrowSize,
    arrowDistance,
    anchorStroke,
    plotRight,
  );

  if (object._hitArrow) {
    for (const handle of arrowHandles) {
      if (handle.x === object._hitArrow.x && handle.y === object._hitArrow.y) {
        drawAnchorArrow(
          octx,
          panel,
          handle,
          shape.anchorPointArrowSize + 2,
          arrowDistance,
          anchorHover,
          1,
        );
      }
    }
  }
}

function formatPrice(value: number, precision: number): string {
  return LIB.round(value, precision).toFixed(Math.min(precision, 8));
}

function formatPercentOffset(from: number, to: number): string {
  if (!Number.isFinite(from) || from === 0) {
    return "";
  }

  const pct = ((to - from) / from) * 100;
  const sign = pct >= 0 ? "+" : "";
  return ` (${sign}${pct.toFixed(2)}%)`;
}

function drawLevelLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  title: string,
  priceText: string,
  color: string,
): void {
  const text = `${title}  ${priceText}`;
  ctx.font = WEBRCP.utils.colorManager.getFont("text", "400 11px Chivo, Roboto, sans-serif");
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawZonePnlLabel(
  ctx: CanvasRenderingContext2D,
  leftX: number,
  width: number,
  centerY: number,
  text: string,
  color: string,
): void {
  ctx.font = WEBRCP.utils.colorManager.getFont("text", "600 12px Chivo, Roboto, sans-serif");
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  ctx.fillText(text, leftX + width / 2, centerY);
  ctx.textAlign = "left";
}

function drawBoxRect(
  ctx: CanvasRenderingContext2D,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  strokeColor: string,
  fillColor: string,
  lineWidth: number,
  dash: number[],
): void {
  const left = Math.min(p0.x, p1.x);
  const top = Math.min(p0.y, p1.y);
  const width = Math.max(Math.abs(p1.x - p0.x), 8);
  const height = Math.max(Math.abs(p1.y - p0.y), 1);

  ctx.save();
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.fillStyle = fillColor;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(left, top, width, height);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = strokeColor;
  ctx.strokeRect(left, top, width, height);
  ctx.restore();
}

function readEventPrice(
  shape: ShapeRuntime,
  e: ShapeInteractionArgs[0],
  o: LegacyShapeObject,
  renderer: ShapeInteractionArgs[2],
  interactor: ShapeInteractionArgs[3],
  model: ShapeInteractionArgs[4],
  panel: ShapeInteractionArgs[5],
  seriesManager: ShapeInteractionArgs[6],
): number {
  const referenceValue = LIB.getReferenceValue(o, model, seriesManager);
  const index = renderer.getPointIndex(e._offset.offsetX, model);
  const yValue = e._offset.offsetY - panel._offset;
  const rawValue = isDrawingSnapEnabled(o, interactor)
    ? shape.stickToCandleValue(
        yValue,
        shape.getCurrentCandles(index, model, seriesManager),
        panel,
        renderer,
        referenceValue,
      )
    : renderer.getPriceForYCoordinate(yValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV: referenceValue,
      });
  return LIB.round(rawValue, renderer.getPrecision(model, panel));
}

function finalizeFirstBox(o: LegacyShapeObject): void {
  ensurePositionAnchors(o);

  const entryPrice = readPrice(o.anchors[ENTRY_ANCHOR].value, 0);
  const cornerPrice = readPrice(o.anchors[BOX_CORNER_B].value, 0);
  const role = classifyCornerRole(readDirection(o), entryPrice, cornerPrice);

  o._firstLevelRole = role;
  o._placementStep = 1;
  o._entryPriceManual = true;
  o.entryPrice = entryPrice;

  syncPricesFromAnchors(o);
}

function drawStaging(
  o: LegacyShapeObject,
  ctx: CanvasRenderingContext2D,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
  pts: Array<{ x: number; y: number }>,
): void {
  const step = getPlacementStep(o);
  const direction = readDirection(o);
  const fV = LIB.getReferenceValue(o, model, seriesManager);
  const priceContext = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV,
  };
  const profitColor =
    typeof o.profitColor === "string"
      ? o.profitColor
      : WEBRCP.utils.colorManager.getColor("chartGreen");
  const lossColor =
    typeof o.lossColor === "string"
      ? o.lossColor
      : WEBRCP.utils.colorManager.getColor("chartRed");
  const borderColor = o.color
    ? o.color
    : WEBRCP.utils.colorManager.getColor("defaultToolColor");
  const labelColor = WEBRCP.utils.colorManager.getColor("primaryTextColor");
  const lineWidth = typeof o.width === "number" && o.width > 0 ? o.width : 1;
  const dash = Array.isArray(o.dash) ? o.dash : [];
  const precision = panel.precision ?? 2;

  const entryPrice = readPrice(o.anchors[ENTRY_ANCHOR].value, 0);
  const entryY =
    renderer.getYCoordinateForPrice(entryPrice, priceContext) + panel._offset;
  const { leftX, rightX } = getBoxHorizontalBounds(pts);

  ctx.save();
  ctx.lineWidth = lineWidth;

  if (step === 0 && pts[ENTRY_ANCHOR]) {
    ctx.strokeStyle = borderColor;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(leftX, entryY);
    ctx.lineTo(rightX, entryY);
    ctx.stroke();
    ctx.setLineDash(dash);

    drawLevelLabel(
      ctx,
      pts[ENTRY_ANCHOR].x + 6,
      entryY,
      "Entry",
      formatPrice(entryPrice, precision),
      labelColor,
    );

    if (pts[BOX_CORNER_B]) {
      const cornerPrice = readPrice(o.anchors[BOX_CORNER_B].value, entryPrice);
      const moved =
        Math.abs(pts[ENTRY_ANCHOR].x - pts[BOX_CORNER_B].x) > 2 ||
        Math.abs(pts[ENTRY_ANCHOR].y - pts[BOX_CORNER_B].y) > 2;

      if (moved) {
        const role = classifyCornerRole(direction, entryPrice, cornerPrice);
        const zoneColor = role === "target" ? profitColor : lossColor;
        const roleTitle = role === "target" ? "Target" : "Stop";

        drawBoxRect(
          ctx,
          pts[ENTRY_ANCHOR],
          pts[BOX_CORNER_B],
          borderColor,
          zoneColor,
          lineWidth,
          dash,
        );

        drawLevelLabel(
          ctx,
          rightX + 6,
          pts[BOX_CORNER_B].y,
          roleTitle,
          formatPrice(cornerPrice, precision) + formatPercentOffset(entryPrice, cornerPrice),
          zoneColor,
        );
      }
    }
  }

  if (step === 1 && pts[ENTRY_ANCHOR] && pts[BOX_CORNER_B]) {
    const firstPrice = readPrice(o.anchors[BOX_CORNER_B].value, entryPrice);
    const firstRole =
      (o._firstLevelRole as LevelRole) ?? classifyCornerRole(direction, entryPrice, firstPrice);
    const firstColor = firstRole === "target" ? profitColor : lossColor;
    const firstY =
      renderer.getYCoordinateForPrice(firstPrice, priceContext) + panel._offset;

    drawBoxRect(
      ctx,
      pts[ENTRY_ANCHOR],
      { x: pts[BOX_CORNER_B].x, y: firstY },
      borderColor,
      firstColor,
      lineWidth,
      dash,
    );

    const previewPrice = readPrice(o._previewLevelPrice, NaN);
    if (
      Number.isFinite(previewPrice) &&
      previewPrice !== firstPrice &&
      isOnOppositeSideOfEntry(entryPrice, firstPrice, previewPrice)
    ) {
      const secondRole = oppositeRole(firstRole);
      const secondColor = secondRole === "target" ? profitColor : lossColor;
      const previewY =
        renderer.getYCoordinateForPrice(previewPrice, priceContext) + panel._offset;
      const secondTitle = secondRole === "target" ? "Target" : "Stop";

      drawBoxRect(
        ctx,
        { x: leftX, y: entryY },
        { x: rightX, y: previewY },
        borderColor,
        secondColor,
        lineWidth,
        dash,
      );

      drawLevelLabel(
        ctx,
        rightX + 6,
        previewY,
        secondTitle,
        formatPrice(previewPrice, precision) +
          formatPercentOffset(entryPrice, previewPrice),
        secondColor,
      );
    }

    ctx.strokeStyle = borderColor;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(leftX, entryY);
    ctx.lineTo(rightX, entryY);
    ctx.stroke();
    ctx.setLineDash(dash);

    drawLevelLabel(
      ctx,
      pts[ENTRY_ANCHOR].x + 6,
      entryY,
      "Entry",
      formatPrice(entryPrice, precision),
      labelColor,
    );
    const firstTitle = firstRole === "target" ? "Target" : "Stop";
    drawLevelLabel(
      ctx,
      rightX + 6,
      firstY,
      firstTitle,
      formatPrice(firstPrice, precision) + formatPercentOffset(entryPrice, firstPrice),
      firstColor,
    );
  }

  ctx.restore();
}

function renderCompletePosition(
  o: LegacyShapeObject,
  ctx: CanvasRenderingContext2D,
  renderer: ShapeRenderArgs[2],
  model: ShapeRenderArgs[3],
  panel: ShapeRenderArgs[4],
  seriesManager: ShapeRenderArgs[5],
  pts: Array<{ x: number; y: number }>,
): void {
  syncPricesFromAnchors(o);

  const fV = LIB.getReferenceValue(o, model, seriesManager);
  const priceContext = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV,
  };

  const stopPrice = readPrice(o.stopPrice, 0);
  const targetPrice = readPrice(o.targetPrice, 0);
  const entryPrice = readPrice(o.entryPrice, 0);

  const stopY =
    renderer.getYCoordinateForPrice(stopPrice, priceContext) + panel._offset;
  const targetY =
    renderer.getYCoordinateForPrice(targetPrice, priceContext) + panel._offset;
  const entryY =
    renderer.getYCoordinateForPrice(entryPrice, priceContext) + panel._offset;

  const { leftX, rightX } = getBoxHorizontalBounds(pts);
  const plotRight = getPlotRight(panel, renderer);
  const span = getRenderHorizontalSpan(o, leftX, rightX, plotRight);
  const width = Math.max(span.rightX - span.leftX, 8);
  const labelX = span.rightX + 6;

  const profitColor =
    typeof o.profitColor === "string"
      ? o.profitColor
      : WEBRCP.utils.colorManager.getColor("chartGreen");
  const lossColor =
    typeof o.lossColor === "string"
      ? o.lossColor
      : WEBRCP.utils.colorManager.getColor("chartRed");
  const borderColor = o.color
    ? o.color
    : WEBRCP.utils.colorManager.getColor("defaultToolColor");
  const labelColor = WEBRCP.utils.colorManager.getColor("primaryTextColor");

  const topY = Math.min(stopY, targetY, entryY);
  const bottomY = Math.max(stopY, targetY, entryY);
  const profitFromY = Math.min(targetY, entryY);
  const profitToY = Math.max(targetY, entryY);
  const lossFromY = Math.min(stopY, entryY);
  const lossToY = Math.max(stopY, entryY);

  const pnl = computePositionPnl(readPositionPnlInput(o));

  ctx.save();
  ctx.lineWidth = typeof o.width === "number" && o.width > 0 ? o.width : 1;
  ctx.setLineDash(Array.isArray(o.dash) ? o.dash : []);

  ctx.fillStyle = profitColor;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(span.leftX, profitFromY, width, Math.abs(profitToY - profitFromY));

  ctx.fillStyle = lossColor;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(span.leftX, lossFromY, width, Math.abs(lossToY - lossFromY));

  ctx.globalAlpha = 1;
  ctx.strokeStyle = borderColor;
  ctx.strokeRect(span.leftX, topY, width, bottomY - topY);

  const precision = panel.precision ?? 2;

  ctx.strokeStyle = profitColor;
  ctx.beginPath();
  ctx.moveTo(span.leftX, targetY);
  ctx.lineTo(span.rightX, targetY);
  ctx.stroke();

  ctx.strokeStyle = lossColor;
  ctx.beginPath();
  ctx.moveTo(span.leftX, stopY);
  ctx.lineTo(span.rightX, stopY);
  ctx.stroke();

  ctx.strokeStyle = borderColor;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(span.leftX, entryY);
  ctx.lineTo(span.rightX, entryY);
  ctx.stroke();
  ctx.setLineDash([]);

  drawLevelLabel(
    ctx,
    labelX,
    targetY,
    "Target",
    formatPrice(targetPrice, precision) + formatPercentOffset(entryPrice, targetPrice),
    profitColor,
  );
  drawLevelLabel(
    ctx,
    labelX,
    entryY,
    "Entry",
    formatPrice(entryPrice, precision),
    labelColor,
  );
  drawLevelLabel(
    ctx,
    labelX,
    stopY,
    "Stop",
    formatPrice(stopPrice, precision) + formatPercentOffset(entryPrice, stopPrice),
    lossColor,
  );

  if (pnl.quantity > 0) {
    drawZonePnlLabel(
      ctx,
      span.leftX,
      width,
      (profitFromY + profitToY) / 2,
      formatPnlCurrency(pnl.pnlAtTarget),
      profitColor,
    );
    drawZonePnlLabel(
      ctx,
      span.leftX,
      width,
      (lossFromY + lossToY) / 2,
      formatPnlCurrency(pnl.pnlAtStop),
      pnl.pnlAtStop >= 0 ? profitColor : lossColor,
    );
  }

  if (pnl.riskRewardRatio != null) {
    ctx.font = WEBRCP.utils.colorManager.getFont("text", "500 11px Chivo, Roboto, sans-serif");
    ctx.textBaseline = "middle";
    ctx.fillStyle = labelColor;
    ctx.fillText(`R:R  1 : ${pnl.riskRewardRatio.toFixed(2)}`, span.leftX + 8, entryY - 14);
  }

  ctx.restore();
}

export function readPositionPnlInput(object: LegacyShapeObject): PositionPnlInput {
  const stopPrice = readPrice(object.stopPrice, 0);
  const targetPrice = readPrice(object.targetPrice, 0);
  const entryPrice = readPrice(object.entryPrice, resolveEntryPrice(object, stopPrice, targetPrice));

  const qtyOverride = readPrice(object.quantity, NaN);
  return {
    direction: readDirection(object),
    entryPrice,
    stopPrice,
    targetPrice,
    accountSize: readPrice(object.accountSize, 10000),
    riskMode: readRiskMode(object.riskMode),
    riskAmount: readPrice(object.riskAmount, 100),
    riskPercent: readPrice(object.riskPercent, 1),
    quantityOverride: Number.isFinite(qtyOverride) && qtyOverride > 0 ? qtyOverride : null,
    leverage: readPrice(object.leverage, 1),
  };
}

function LongShortPositionObject(this: ShapeRuntime) {
  this.render = function (...[o, ctx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    if (!panel || (o.hidden === true && o._isStaging !== true)) {
      return;
    }

    ensurePositionAnchors(o);

    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (pts.length < 2) {
      return;
    }

    if (!isPlacementComplete(o)) {
      drawStaging(o, ctx, renderer, model, panel, seriesManager, pts);
      return;
    }

    renderCompletePosition(o, ctx, renderer, model, panel, seriesManager, pts);
  };

  this.renderOverlay = function (...[o, octx, renderer, model, panel, seriesManager]: ShapeRenderArgs) {
    if (o.hidden === true && o._isStaging !== true) {
      return;
    }

    if (!isPlacementComplete(o)) {
      return;
    }

    if (!o.selected && !o._hit) {
      return;
    }

    drawLongShortSelectionHandles(this, o, octx, renderer, model, panel, seriesManager);
  };

  this.renderAnchorsOverlay = function (
    o: LegacyShapeObject,
    octx: CanvasRenderingContext2D,
    renderer: ShapeRenderArgs[2],
    model: ShapeRenderArgs[3],
    panel: ShapeRenderArgs[4],
    seriesManager: ShapeRenderArgs[5],
    options?: { forceShow?: boolean; drawArrowHandles?: boolean },
  ) {
    if (o.hidden === true && o._isStaging !== true) {
      return;
    }

    if (!isPlacementComplete(o)) {
      return;
    }

    if (options?.forceShow !== true && !o.selected && !o._hit) {
      return;
    }

    drawLongShortSelectionHandles(this, o, octx, renderer, model, panel, seriesManager);
  };

  this.hit = function (...[x, y, o, renderer, , model, panel, seriesManager]: ShapeHitArgs) {
    if (o.hidden === true && o._isStaging !== true) {
      return false;
    }

    if (!isPlacementComplete(o)) {
      return false;
    }

    syncPricesFromAnchors(o);
    syncPositionExpandedState(o);
    const pts = this.getPoints(o, renderer, panel, model, seriesManager);
    if (pts.length < 2) {
      return false;
    }

    this.clearHits(o);

    const { leftX, rightX } = getBoxHorizontalBounds(pts);
    const plotRight = getPlotRight(panel, renderer);
    const span = getRenderHorizontalSpan(o, leftX, rightX, plotRight);

    const arrowHandles = buildExpandableAnchorArrowHandles(
      this,
      o,
      renderer,
      model,
      panel,
      seriesManager,
    );
    const arrowHandle = findLevelHandleArrowForXY(arrowHandles, x, y, this.hitTolerance);
    if (arrowHandle) {
      o._hit = true;
      o._hitArrow = { x: arrowHandle.x, y: arrowHandle.y };
      return true;
    }

    for (let index = 0; index < Math.min(pts.length, 3); index += 1) {
      if (
        isLevelHandleArrowHit(
          x,
          y,
          arrowHandles.filter((handle) => handle.anchorIndex === index),
          this.hitTolerance,
        )
      ) {
        continue;
      }

      if (
        between(pts[index].x, x, pts[index].x, this.hitTolerance) &&
        between(pts[index].y, y, pts[index].y, this.hitTolerance)
      ) {
        o._hit = true;
        o._hitAnchor = { x: pts[index].x, y: pts[index].y };
        return true;
      }
    }

    const stopPrice = readPrice(o.stopPrice, 0);
    const targetPrice = readPrice(o.targetPrice, 0);
    const entryPrice = readPrice(o.entryPrice, 0);

    const fV = LIB.getReferenceValue(o, model, seriesManager);
    const priceContext = {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
      fV,
    };

    const stopY =
      renderer.getYCoordinateForPrice(stopPrice, priceContext) + panel._offset;
    const targetY =
      renderer.getYCoordinateForPrice(targetPrice, priceContext) + panel._offset;
    const entryY =
      renderer.getYCoordinateForPrice(entryPrice, priceContext) + panel._offset;

    const hitLeftX = span.leftX - this.hitTolerance;
    const hitRightX = span.rightX + this.hitTolerance;
    const topY = Math.min(stopY, targetY, entryY) - this.hitTolerance;
    const bottomY = Math.max(stopY, targetY, entryY) + this.hitTolerance;
    const levelYs = [stopY, targetY, entryY];

    for (const levelY of levelYs) {
      if (
        between(hitLeftX, x, hitRightX, this.hitTolerance) &&
        between(levelY - this.hitTolerance, y, levelY + this.hitTolerance, this.hitTolerance)
      ) {
        o._hit = true;
        return true;
      }
    }

    if (
      between(hitLeftX, x, hitRightX, this.hitTolerance) &&
      between(topY, y, bottomY, this.hitTolerance)
    ) {
      const onLevelLine = levelYs.some((levelY) =>
        between(levelY - this.hitTolerance, y, levelY + this.hitTolerance, this.hitTolerance),
      );

      if (!onLevelLine) {
        o._hit = true;
        return true;
      }
    }

    return false;
  };

  this.mouseDown = function (...args: ShapeInteractionArgs) {
    const [event, object, renderer, interactor, model, panel, seriesManager] = args;

    this.wasDrag = false;

    if (isPlacementComplete(object)) {
      const arrowHandles = buildExpandableAnchorArrowHandles(
        this,
        object,
        renderer,
        model,
        panel,
        seriesManager,
      );
      const arrowHandle = findLevelHandleArrowForXY(
        arrowHandles,
        event._offset.offsetX,
        event._offset.offsetY,
        this.hitTolerance,
      );

      if (arrowHandle) {
        object._hitArrow = { x: arrowHandle.x, y: arrowHandle.y };
        return this.createAnchorSelection(object, null);
      }

      syncAnchorsFromPrices(object);
      const pts = this.getPoints(object, renderer, panel, model, seriesManager);
      const x = event._offset.offsetX;
      const y = event._offset.offsetY;

      for (const index of [BOX_CORNER_B, OPPOSITE_LEVEL, ENTRY_ANCHOR]) {
        const point = pts[index];
        if (
          point &&
          interactor.isOver(x, y, point.x, point.y, this.hitTolerance)
        ) {
          return this.createAnchorSelection(object, index);
        }
      }

      const { stopY, targetY } = getLevelYCoordinates(
        object,
        renderer,
        model,
        panel,
        seriesManager,
      );
      const { leftX, rightX } = getBoxHorizontalBounds(pts);
      const plotRight = getPlotRight(panel, renderer);
      const span = getRenderHorizontalSpan(object, leftX, rightX, plotRight);
      const { stop: stopAnchor, target: targetAnchor } = getStopTargetAnchorIndices(object);

      if (between(span.leftX, x, span.rightX, this.hitTolerance)) {
        if (between(stopY - this.hitTolerance, y, stopY + this.hitTolerance, this.hitTolerance)) {
          return this.createAnchorSelection(object, stopAnchor);
        }

        if (between(targetY - this.hitTolerance, y, targetY + this.hitTolerance, this.hitTolerance)) {
          return this.createAnchorSelection(object, targetAnchor);
        }
      }

      if (object._hit) {
        return this.createAnchorSelection(object, null);
      }
    }

    return Shape.prototype.mouseDown.call(
      this,
      event,
      object,
      renderer,
      interactor,
      model,
      panel,
      seriesManager,
    );
  };
  this.mouseUp = function (...args: ShapeInteractionArgs) {
    const [event, object, renderer, interactor, model, panel, seriesManager] = args;

    if (!this.wasDrag) {
      const arrowHandles = buildExpandableAnchorArrowHandles(
        this,
        object,
        renderer,
        model,
        panel,
        seriesManager,
      );
      for (const handle of arrowHandles) {
        if (
          isOverLevelHandleArrow(interactor, event, handle, this.hitTolerance)
        ) {
          setPositionExpanded(object, !isPositionExpanded(object));
          interactor.controller?.render();
          interactor.controller?.renderOverlay?.();
          break;
        }
      }
    }

    this.wasDrag = false;
  };
  this.mouseOut = createShapeMouseOutDelegate();

  this.mouseDrag = function (...args: ShapeInteractionArgs) {
    const [event, object, renderer, interactor, model, panel, seriesManager] = args;
    const selected = interactor.currentAnchor?.selected;

    if (
      (selected === BOX_CORNER_B || selected === OPPOSITE_LEVEL) &&
      Array.isArray(object.anchors) &&
      object.anchors.length >= 3
    ) {
      const yValue = event._offset.offsetY - (panel._offset ?? 0);
      const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
      const rawValue = renderer.getPriceForYCoordinate(yValue, {
        panelHeight: panel._height,
        minValue: panel.vMin,
        maxValue: panel.vMax,
        valueAxisMode: panel.valueAxisMode,
        fV: referenceValue,
      });

      object.anchors[selected].value = LIB.round(
        rawValue,
        renderer.getPrecision(model, panel),
      );
      tieOppositeCornerToEntryCorner(object);
      syncPricesFromAnchors(object);
      this.wasDrag = true;
      return;
    }

    if (selected === ENTRY_ANCHOR) {
      Shape.prototype.mouseDrag.call(this, ...args);
      tieOppositeCornerToEntryCorner(object);
      syncPricesFromAnchors(object);
      return;
    }

    Shape.prototype.mouseDrag.call(this, ...args);

    if (!isPlacementComplete(object)) {
      return;
    }

    if (selected == null) {
      tieOppositeCornerToEntryCorner(object);
      syncPricesFromAnchors(object);
      this.wasDrag = true;
      return;
    }

    if (
      selected === ENTRY_ANCHOR ||
      selected === BOX_CORNER_B ||
      selected === OPPOSITE_LEVEL
    ) {
      if (selected === ENTRY_ANCHOR) {
        object.entryPrice = readPrice(object.anchors[ENTRY_ANCHOR].value, object.entryPrice ?? 0);
        object._entryPriceManual = true;
      }
      tieOppositeCornerToEntryCorner(object);
      syncPricesFromAnchors(object);
    }
  };

  this.stageDown = function (...args: ShapeInteractionArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;

    ensurePositionAnchors(o);

    if (getPlacementStep(o) === 0) {
      const isSecondCornerClick = interactor.currentAnchor != null;
      const result = Shape.prototype.stageDown.call(
        this,
        e,
        o,
        renderer,
        interactor,
        model,
        panel,
        seriesManager,
      ) as { selected: number; anchors: LegacyAnchor[] };

      if (isSecondCornerClick) {
        finalizeFirstBox(o);
        if (interactor.currentAnchor) {
          interactor.currentAnchor.drag = false;
        }
      }

      return result;
    }

    if ((getPlacementStep(o) === 1 || (getPlacementStep(o) === 0 && hasFirstBoxCommitted(o))) && panel) {
      const entryPrice = readPrice(o.anchors[ENTRY_ANCHOR].value, 0);
      const firstPrice = readPrice(o.anchors[BOX_CORNER_B].value, entryPrice);
      const clickPrice = readEventPrice(this, e, o, renderer, interactor, model, panel, seriesManager);

      if (!isOnOppositeSideOfEntry(entryPrice, firstPrice, clickPrice)) {
        return {
          selected: OPPOSITE_LEVEL,
          anchors: this.cloneAnchors(o.anchors),
        };
      }

      ensurePositionAnchors(o);
      const boxB = o.anchors[BOX_CORNER_B];
      const opposite = o.anchors[OPPOSITE_LEVEL];
      if (!boxB || !opposite) {
        return {
          selected: OPPOSITE_LEVEL,
          anchors: this.cloneAnchors(o.anchors),
        };
      }

      opposite.value = clickPrice;
      tieOppositeCornerToEntryCorner(o);

      o._placementStep = 2;
      syncPricesFromAnchors(o);

      return {
        selected: OPPOSITE_LEVEL,
        anchors: this.cloneAnchors(o.anchors),
      };
    }

    return {
      selected: 0,
      anchors: this.cloneAnchors(o.anchors),
    };
  };

  this.stageDrag = function (...args: ShapeInteractionArgs) {
    const o = args[1];
    const interactor = args[3];

    if (getPlacementStep(o) === 0) {
      Shape.prototype.stageDrag.call(this, ...args);
      return;
    }

    if (getPlacementStep(o) === 1) {
      this.stageMove(...args);
      interactor.controller?.renderOverlay?.();
    }
  };

  this.stageMove = function (...args: ShapeInteractionArgs) {
    const [e, o, renderer, interactor, model, panel, seriesManager] = args;
    if (!panel) {
      return;
    }

    if (getPlacementStep(o) === 0 && interactor.currentAnchor) {
      Shape.prototype.stageMove.call(
        this,
        e,
        o,
        renderer,
        interactor,
        model,
        panel,
        seriesManager,
      );
      return;
    }

    if (getPlacementStep(o) === 1) {
      o._previewLevelPrice = readEventPrice(this, e, o, renderer, interactor, model, panel, seriesManager);
      interactor.controller?.renderOverlay?.();
    }
  };

  this.stageUp = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);

    if (getPlacementStep(o) === 0) {
      const entryPrice = readPrice(o.anchors[ENTRY_ANCHOR].value, 0);
      const cornerPrice = readPrice(o.anchors[BOX_CORNER_B].value, 0);
      const cornerMoved = cornerPrice !== entryPrice;

      if (interactor.currentAnchor?.drag === true || cornerMoved) {
        finalizeFirstBox(o);
        if (interactor.currentAnchor) {
          interactor.currentAnchor.drag = false;
        }
      }
      return undefined;
    }

    if (getPlacementStep(o) >= 2) {
      o.hidden = false;
      syncPricesFromAnchors(o);
      (interactor as { currentAnchor: unknown }).currentAnchor = null;
      return true;
    }

    return undefined;
  };

  this.stageOut = function (...[, o, , interactor, , panel]: ShapeLifecycleArgs) {
    interactor.popPanel(this, o, panel);
  };
}

const LongShortPositionObjectCtor: import("./_sharedTypes").ShapeConstructor =
  LongShortPositionObject as unknown as import("./_sharedTypes").ShapeConstructor;
export { LongShortPositionObjectCtor as LongShortPositionObject, syncAnchorsFromPrices };
