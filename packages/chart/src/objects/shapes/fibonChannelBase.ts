import type { LegacyShapePoint } from "../../objectRuntimeBases";

export interface FibChannelLevelLine {
  level: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface FibChannelGeometry {
  baseline: FibChannelLevelLine;
  levels: FibChannelLevelLine[];
  channelHeight: number;
}

export const FIBON_CHANNEL_DEFAULT_VALUES = [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100, 161.8, 261.8, 423.6];

export const FIBON_CHANNEL_DEFAULT_VALUES_STATE = [
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  false,
];

function signedPerpendicularDistance(
  point: LegacyShapePoint,
  lineStart: LegacyShapePoint,
  lineEnd: LegacyShapePoint,
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    return 0;
  }

  return ((point.x - lineStart.x) * dy - (point.y - lineStart.y) * dx) / length;
}

function offsetParallelLine(
  lineStart: LegacyShapePoint,
  lineEnd: LegacyShapePoint,
  offsetDistance: number,
): Pick<FibChannelLevelLine, "x0" | "y0" | "x1" | "y1"> {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    return {
      x0: lineStart.x,
      y0: lineStart.y,
      x1: lineEnd.x,
      y1: lineEnd.y,
    };
  }

  const normalX = -dy / length;
  const normalY = dx / length;

  return {
    x0: lineStart.x + normalX * offsetDistance,
    y0: lineStart.y + normalY * offsetDistance,
    x1: lineEnd.x + normalX * offsetDistance,
    y1: lineEnd.y + normalY * offsetDistance,
  };
}

export function resolveFibonChannelGeometry(
  points: LegacyShapePoint[],
  values: number[],
  valuesState: Array<boolean | undefined>,
): FibChannelGeometry | null {
  if (points.length < 3) {
    return null;
  }

  const channelHeight = -signedPerpendicularDistance(points[2], points[0], points[1]);
  const baseline = {
    level: 0,
    x0: points[0].x,
    y0: points[0].y,
    x1: points[1].x,
    y1: points[1].y,
  };
  const levels: FibChannelLevelLine[] = [];

  for (let index = 0; index < values.length; index += 1) {
    if (valuesState[index] !== true) {
      continue;
    }

    const level = values[index];
    if (typeof level !== "number" || !Number.isFinite(level)) {
      continue;
    }

    const offset = (channelHeight * level) / 100;
    const line = offsetParallelLine(points[0], points[1], offset);
    levels.push({
      level,
      ...line,
    });
  }

  if (levels.length === 0) {
    return null;
  }

  levels.sort((left, right) => left.level - right.level);

  return {
    baseline,
    levels,
    channelHeight,
  };
}

export function interpolateLineY(line: FibChannelLevelLine, x: number): number {
  const dx = line.x1 - line.x0;
  if (dx === 0) {
    return (line.y0 + line.y1) / 2;
  }

  const ratio = (x - line.x0) / dx;
  return line.y0 + ratio * (line.y1 - line.y0);
}

export function formatFibChannelLevelLabel(level: number, price: number, precision: number): string {
  const ratio = level / 100;
  const ratioText =
    ratio === 0 || ratio === 1
      ? ratio.toFixed(1)
      : ratio
          .toFixed(3)
          .replace(/0+$/, "")
          .replace(/\.$/, "");
  const priceText = price.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return `${ratioText} (${priceText})`;
}

export function resolveFibChannelLabelEdgeX(
  points: LegacyShapePoint[],
  line: FibChannelLevelLine,
): number {
  const anchorEdgeX = Math.min(points[0].x, points[1].x, points[2].x);
  const lineEdgeX = Math.min(line.x0, line.x1);
  return Math.min(anchorEdgeX, lineEdgeX);
}

export function snapFibonChannelWidthAnchor(
  points: LegacyShapePoint[],
  geometry: FibChannelGeometry | null,
): LegacyShapePoint[] {
  if (!geometry || points.length < 3) {
    return points;
  }

  const widthLevel =
    geometry.levels.find((level) => level.level === 100) ??
    geometry.levels[geometry.levels.length - 1];
  if (!widthLevel) {
    return points;
  }

  const anchorX = points[2].x;
  const snapped = [...points];
  snapped[2] = {
    ...snapped[2],
    x: anchorX,
    y: interpolateLineY(widthLevel, anchorX),
  };
  return snapped;
}

export function resolveFibonChannelAnchorHitTolerance(
  hitTolerance: number,
  anchorPointSize: number,
  selected = false,
): number {
  const baseTolerance = Math.max(hitTolerance * 2, anchorPointSize * 4, 20);
  return selected ? baseTolerance + 10 : baseTolerance;
}

export function pickFibonChannelAnchorIndex(
  x: number,
  y: number,
  points: LegacyShapePoint[],
  tolerance: number,
): number | null {
  let bestIndex: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const dx = Math.abs(x - point.x);
    const dy = Math.abs(y - point.y);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const anchorTolerance = index === 2 ? tolerance * 2.5 : tolerance;
    const inCircle = distance <= anchorTolerance;
    const inWidthHandleBox =
      index === 2 && dx <= anchorTolerance && dy <= anchorTolerance * 2.5;

    if (!inCircle && !inWidthHandleBox) {
      continue;
    }

    const score = distance + dx * (index === 2 ? 0.15 : 0.35);
    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
}
