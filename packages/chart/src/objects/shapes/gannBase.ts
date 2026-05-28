import {
  getLinePointNearestMouse,
  pointsDistance,
} from "../../utils/objects-lib";
import type { LegacyShapePoint } from "../../objectRuntimeBases";

export interface GannRatio {
  price: number;
  time: number;
}

export interface GannLineSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface GannRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export interface GannPlotBounds {
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
}

export interface GannFanLevel extends GannRatio {
  label: string;
  lineColor: string;
  fillColor: string;
}

export interface GannFanRay {
  segment: GannLineSegment;
  level: GannFanLevel;
  angle: number;
}

export interface GannFanGeometry {
  origin: { x: number; y: number };
  rays: GannFanRay[];
}

export interface GannSquareLevel {
  fraction: number;
  label: string;
  lineColor: string;
  fillColor: string;
}

export interface GannSquareLine {
  segment: GannLineSegment;
  level: GannSquareLevel;
  axis: "horizontal" | "vertical";
}

export interface GannSquareGeometry {
  rect: GannRect;
  lines: GannSquareLine[];
}

export interface GannBoxGeometry extends GannSquareGeometry {
  diagonals: GannFanRay[];
}

/** TradingView-style Gann fan levels (not evenly spaced in angle — ratios define slope). */
export const GANN_FAN_LEVELS: GannFanLevel[] = [
  { price: 1, time: 8, label: "1/8", lineColor: "#FF9800", fillColor: "rgba(255, 152, 0, 0.18)" },
  { price: 1, time: 4, label: "1/4", lineColor: "#33691E", fillColor: "rgba(51, 105, 30, 0.18)" },
  { price: 1, time: 3, label: "1/3", lineColor: "#558B2F", fillColor: "rgba(85, 139, 47, 0.18)" },
  { price: 1, time: 2, label: "1/2", lineColor: "#00897B", fillColor: "rgba(0, 137, 123, 0.18)" },
  { price: 1, time: 1, label: "1/1", lineColor: "#29B6F6", fillColor: "rgba(41, 182, 246, 0.18)" },
  { price: 2, time: 1, label: "2/1", lineColor: "#1E88E5", fillColor: "rgba(30, 136, 229, 0.18)" },
  { price: 3, time: 1, label: "3/1", lineColor: "#7E57C2", fillColor: "rgba(126, 87, 194, 0.18)" },
  { price: 4, time: 1, label: "4/1", lineColor: "#EC407A", fillColor: "rgba(236, 64, 122, 0.18)" },
  { price: 8, time: 1, label: "8/1", lineColor: "#E53935", fillColor: "rgba(229, 57, 53, 0.18)" },
];

export const GANN_FAN_RATIOS: GannRatio[] = GANN_FAN_LEVELS.map(({ price, time }) => ({ price, time }));

/**
 * TradingView Gann square / box divisions — not uniform 1/8 spacing;
 * mixes quarters with Fibonacci retracement levels (0.382, 0.618).
 */
export const GANN_SQUARE_FRACTIONS = [0, 0.25, 0.382, 0.5, 0.618, 0.75, 1];

export const GANN_SQUARE_LEVELS: GannSquareLevel[] = [
  { fraction: 0, label: "0", lineColor: "#FF9800", fillColor: "rgba(255, 152, 0, 0.14)" },
  { fraction: 0.25, label: "0.25", lineColor: "#FF9800", fillColor: "rgba(255, 152, 0, 0.12)" },
  { fraction: 0.382, label: "0.382", lineColor: "#26A69A", fillColor: "rgba(38, 166, 154, 0.12)" },
  { fraction: 0.5, label: "0.5", lineColor: "#43A047", fillColor: "rgba(67, 160, 71, 0.12)" },
  { fraction: 0.618, label: "0.618", lineColor: "#00897B", fillColor: "rgba(0, 137, 123, 0.12)" },
  { fraction: 0.75, label: "0.75", lineColor: "#1E88E5", fillColor: "rgba(30, 136, 229, 0.12)" },
  { fraction: 1, label: "1", lineColor: "#78909C", fillColor: "rgba(120, 144, 156, 0.12)" },
];

/** @deprecated use GANN_SQUARE_FRACTIONS */
export const GANN_GRID_FRACTIONS = GANN_SQUARE_FRACTIONS.filter(
  (fraction) => fraction > 0 && fraction < 1,
);

export function resolveGannRect(pts: LegacyShapePoint[]): GannRect | null {
  if (!pts || pts.length < 2) return null;

  const left = Math.min(pts[0].x, pts[1].x);
  const right = Math.max(pts[0].x, pts[1].x);
  const top = Math.min(pts[0].y, pts[1].y);
  const bottom = Math.max(pts[0].y, pts[1].y);

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function clipRayByBounds(
  origin: LegacyShapePoint,
  dx: number,
  dy: number,
  bounds: GannPlotBounds,
): GannLineSegment | null {
  if (Math.abs(dx) < 1e-9 && Math.abs(dy) < 1e-9) {
    return null;
  }

  let tMax = Number.POSITIVE_INFINITY;

  if (dx > 0) {
    tMax = Math.min(tMax, (bounds.plotRight - origin.x) / dx);
  } else if (dx < 0) {
    tMax = Math.min(tMax, (bounds.plotLeft - origin.x) / dx);
  }

  if (dy > 0) {
    tMax = Math.min(tMax, (bounds.plotBottom - origin.y) / dy);
  } else if (dy < 0) {
    tMax = Math.min(tMax, (bounds.plotTop - origin.y) / dy);
  }

  if (!Number.isFinite(tMax) || tMax <= 0) {
    return null;
  }

  return {
    x0: origin.x,
    y0: origin.y,
    x1: origin.x + dx * tMax,
    y1: origin.y + dy * tMax,
  };
}

function resolveRayAngle(origin: { x: number; y: number }, segment: GannLineSegment): number {
  return Math.atan2(segment.y1 - origin.y, segment.x1 - origin.x);
}

function resolveFanRays(
  origin: LegacyShapePoint,
  reference: LegacyShapePoint,
  bounds: GannPlotBounds,
  levels: GannFanLevel[],
): GannFanRay[] {
  const refDx = reference.x - origin.x;
  const refDy = reference.y - origin.y;
  const rays: GannFanRay[] = [];

  for (const level of levels) {
    const scale = level.price / level.time;
    const segment = clipRayByBounds(origin, refDx, refDy * scale, bounds);
    if (!segment) continue;

    rays.push({
      segment,
      level,
      angle: resolveRayAngle(origin, segment),
    });
  }

  return rays.sort((a, b) => a.angle - b.angle);
}

export function resolveGannFanGeometry(
  pts: LegacyShapePoint[],
  bounds: GannPlotBounds,
  levels: GannFanLevel[] = GANN_FAN_LEVELS,
): GannFanGeometry | null {
  if (!pts || pts.length < 2) return null;

  const origin = pts[0];
  const rays = resolveFanRays(origin, pts[1], bounds, levels);
  if (rays.length === 0) return null;

  return {
    origin: { x: origin.x, y: origin.y },
    rays,
  };
}

export function resolveGannFanRays(
  pts: LegacyShapePoint[],
  bounds: GannPlotBounds,
  ratios: GannRatio[] = GANN_FAN_RATIOS,
): GannLineSegment[] {
  const levels = ratios.map((ratio) => {
    const match = GANN_FAN_LEVELS.find(
      (level) => level.price === ratio.price && level.time === ratio.time,
    );
    return (
      match ?? {
        ...ratio,
        label: `${ratio.price}/${ratio.time}`,
        lineColor: "#7F9DCC",
        fillColor: "rgba(127, 157, 204, 0.15)",
      }
    );
  });
  const geometry = resolveGannFanGeometry(pts, bounds, levels);
  return geometry?.rays.map((ray) => ray.segment) ?? [];
}

function resolveSquareCoordinate(rect: GannRect, fraction: number, axis: "horizontal" | "vertical"): number {
  if (axis === "horizontal") {
    return rect.top + rect.height * fraction;
  }
  return rect.left + rect.width * fraction;
}

export function resolveGannSquareGeometry(pts: LegacyShapePoint[]): GannSquareGeometry | null {
  const rect = resolveGannRect(pts);
  if (!rect || rect.width < 1 || rect.height < 1) {
    return null;
  }

  const lines: GannSquareLine[] = [];

  for (const level of GANN_SQUARE_LEVELS) {
    if (level.fraction <= 0 || level.fraction >= 1) {
      continue;
    }

    const y = resolveSquareCoordinate(rect, level.fraction, "horizontal");
    lines.push({
      axis: "horizontal",
      level,
      segment: { x0: rect.left, y0: y, x1: rect.right, y1: y },
    });

    const x = resolveSquareCoordinate(rect, level.fraction, "vertical");
    lines.push({
      axis: "vertical",
      level,
      segment: { x0: x, y0: rect.top, x1: x, y1: rect.bottom },
    });
  }

  return { rect, lines };
}

export function resolveGannGridSegments(pts: LegacyShapePoint[]): GannLineSegment[] {
  const geometry = resolveGannSquareGeometry(pts);
  if (!geometry) return [];

  const border: GannLineSegment[] = [
    { x0: geometry.rect.left, y0: geometry.rect.top, x1: geometry.rect.right, y1: geometry.rect.top },
    { x0: geometry.rect.right, y0: geometry.rect.top, x1: geometry.rect.right, y1: geometry.rect.bottom },
    { x0: geometry.rect.right, y0: geometry.rect.bottom, x1: geometry.rect.left, y1: geometry.rect.bottom },
    { x0: geometry.rect.left, y0: geometry.rect.bottom, x1: geometry.rect.left, y1: geometry.rect.top },
  ];

  return [...border, ...geometry.lines.map((line) => line.segment)];
}

export function resolveGannBoxGeometry(pts: LegacyShapePoint[]): GannBoxGeometry | null {
  const square = resolveGannSquareGeometry(pts);
  if (!square) return null;

  const bounds: GannPlotBounds = {
    plotLeft: square.rect.left,
    plotRight: square.rect.right,
    plotTop: square.rect.top,
    plotBottom: square.rect.bottom,
  };

  const diagonals = resolveFanRays(pts[0], pts[1], bounds, GANN_FAN_LEVELS);

  return {
    ...square,
    diagonals,
  };
}

export function resolveGannBoxSegments(
  pts: LegacyShapePoint[],
  ratios: GannRatio[] = GANN_FAN_RATIOS,
): GannLineSegment[] {
  void ratios;
  const geometry = resolveGannBoxGeometry(pts);
  if (!geometry) return [];

  return [
    ...resolveGannGridSegments(pts),
    ...geometry.diagonals.map((ray) => ray.segment),
  ];
}

export function drawGannSegment(
  ctx: CanvasRenderingContext2D,
  segment: GannLineSegment,
  color: string,
  lineWidth: number,
  dash: number[],
): void {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.moveTo(segment.x0, segment.y0);
  ctx.lineTo(segment.x1, segment.y1);
  ctx.stroke();
}

export function drawGannFanFills(ctx: CanvasRenderingContext2D, geometry: GannFanGeometry): void {
  const { origin, rays } = geometry;
  for (let index = 0; index < rays.length - 1; index += 1) {
    const current = rays[index];
    const next = rays[index + 1];
    ctx.beginPath();
    ctx.fillStyle = current.level.fillColor;
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(current.segment.x1, current.segment.y1);
    ctx.lineTo(next.segment.x1, next.segment.y1);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawGannFanLabels(
  ctx: CanvasRenderingContext2D,
  geometry: GannFanGeometry,
  font: string,
): void {
  ctx.font = font;
  ctx.textBaseline = "middle";

  for (const ray of geometry.rays) {
    const labelX = geometry.origin.x + (ray.segment.x1 - geometry.origin.x) * 0.72;
    const labelY = geometry.origin.y + (ray.segment.y1 - geometry.origin.y) * 0.72;
    ctx.fillStyle = ray.level.lineColor;
    ctx.fillText(ray.level.label, labelX + 4, labelY);
  }
}

export function drawGannSquareFills(ctx: CanvasRenderingContext2D, geometry: GannSquareGeometry): void {
  const { rect } = geometry;

  for (let index = 0; index < GANN_SQUARE_LEVELS.length - 1; index += 1) {
    const level = GANN_SQUARE_LEVELS[index];
    const nextFraction = GANN_SQUARE_LEVELS[index + 1].fraction;
    const y1 = resolveSquareCoordinate(rect, level.fraction, "horizontal");
    const y2 = resolveSquareCoordinate(rect, nextFraction, "horizontal");
    ctx.fillStyle = level.fillColor;
    ctx.fillRect(rect.left, y1, rect.width, y2 - y1);
  }

  for (let index = 0; index < GANN_SQUARE_LEVELS.length - 1; index += 1) {
    const level = GANN_SQUARE_LEVELS[index];
    const nextFraction = GANN_SQUARE_LEVELS[index + 1].fraction;
    const x1 = resolveSquareCoordinate(rect, level.fraction, "vertical");
    const x2 = resolveSquareCoordinate(rect, nextFraction, "vertical");
    ctx.fillStyle = level.fillColor.replace("0.12", "0.08").replace("0.14", "0.08");
    ctx.fillRect(x1, rect.top, x2 - x1, rect.height);
  }
}

export function drawGannSquareLines(
  ctx: CanvasRenderingContext2D,
  geometry: GannSquareGeometry,
  lineWidth: number,
  dash: number[],
): void {
  const { rect } = geometry;

  drawGannSegment(
    ctx,
    { x0: rect.left, y0: rect.top, x1: rect.right, y1: rect.top },
    GANN_SQUARE_LEVELS[GANN_SQUARE_LEVELS.length - 1].lineColor,
    lineWidth,
    dash,
  );
  drawGannSegment(
    ctx,
    { x0: rect.right, y0: rect.top, x1: rect.right, y1: rect.bottom },
    GANN_SQUARE_LEVELS[GANN_SQUARE_LEVELS.length - 1].lineColor,
    lineWidth,
    dash,
  );
  drawGannSegment(
    ctx,
    { x0: rect.right, y0: rect.bottom, x1: rect.left, y1: rect.bottom },
    GANN_SQUARE_LEVELS[0].lineColor,
    lineWidth,
    dash,
  );
  drawGannSegment(
    ctx,
    { x0: rect.left, y0: rect.bottom, x1: rect.left, y1: rect.top },
    GANN_SQUARE_LEVELS[0].lineColor,
    lineWidth,
    dash,
  );

  for (const line of geometry.lines) {
    drawGannSegment(ctx, line.segment, line.level.lineColor, lineWidth, dash);
  }
}

export function drawGannSquareLabels(
  ctx: CanvasRenderingContext2D,
  geometry: GannSquareGeometry,
  font: string,
): void {
  const { rect } = geometry;
  ctx.font = font;
  ctx.textBaseline = "middle";

  for (const level of GANN_SQUARE_LEVELS) {
    const y = resolveSquareCoordinate(rect, level.fraction, "horizontal");
    ctx.fillStyle = level.lineColor;
    ctx.textAlign = "left";
    ctx.fillText(level.label, rect.right + 6, y);

    const x = resolveSquareCoordinate(rect, level.fraction, "vertical");
    ctx.textAlign = "center";
    ctx.fillText(level.label, x, rect.top - 6);
    ctx.fillText(level.label, x, rect.bottom + 10);
  }
}

export function hitGannSegments(
  x: number,
  y: number,
  segments: GannLineSegment[],
  tolerance: number,
): boolean {
  for (const segment of segments) {
    const nearest = getLinePointNearestMouse(
      { x0: segment.x0, y0: segment.y0, x1: segment.x1, y1: segment.y1 },
      x,
      y,
    );
    if (pointsDistance({ x, y }, nearest) < tolerance) {
      return true;
    }
  }
  return false;
}

export function resolveGannPlotBounds(
  panel: { _width: number; _offset: number; _height?: unknown },
  valueAxisWidth: number,
): GannPlotBounds {
  const panelHeight = typeof panel._height === "number" ? panel._height : 0;
  return {
    plotLeft: 0,
    plotRight: panel._width - valueAxisWidth,
    plotTop: panel._offset,
    plotBottom: panel._offset + panelHeight,
  };
}

export function collectGannFanHitSegments(geometry: GannFanGeometry): GannLineSegment[] {
  return geometry.rays.map((ray) => ray.segment);
}

export function collectGannSquareHitSegments(geometry: GannSquareGeometry): GannLineSegment[] {
  const { rect } = geometry;
  const border: GannLineSegment[] = [
    { x0: rect.left, y0: rect.top, x1: rect.right, y1: rect.top },
    { x0: rect.right, y0: rect.top, x1: rect.right, y1: rect.bottom },
    { x0: rect.right, y0: rect.bottom, x1: rect.left, y1: rect.bottom },
    { x0: rect.left, y0: rect.bottom, x1: rect.left, y1: rect.top },
  ];
  return [...border, ...geometry.lines.map((line) => line.segment)];
}

export function collectGannBoxHitSegments(geometry: GannBoxGeometry): GannLineSegment[] {
  return [
    ...collectGannSquareHitSegments(geometry),
    ...geometry.diagonals.map((ray) => ray.segment),
  ];
}
