import type { LegacyShapePoint } from "../../objectRuntimeBases";
import { pointsDistance } from "../../utils/objects-lib";

export interface FibCircleLevel {
  level: number;
  centerX: number;
  centerY: number;
  radius: number;
}

export interface FibCirclesGeometry {
  center: LegacyShapePoint;
  reference: LegacyShapePoint;
  levels: FibCircleLevel[];
  trendLine: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  fullRadius: number;
}

export const FIBON_CIRCLES_DEFAULT_VALUES = [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100];

export const FIBON_CIRCLES_DEFAULT_VALUES_STATE = [false, true, true, true, true, true, true];

export function resolveFibonCirclesGeometry(
  points: LegacyShapePoint[],
  values: number[],
  valuesState: Array<boolean | undefined>,
): FibCirclesGeometry | null {
  if (points.length < 2) {
    return null;
  }

  const center = points[0];
  const reference = points[1];
  const fullRadius = pointsDistance(center, reference);
  if (fullRadius <= 0) {
    return null;
  }

  const levels: FibCircleLevel[] = [];

  for (let index = 0; index < values.length; index += 1) {
    if (valuesState[index] !== true) {
      continue;
    }

    const level = values[index];
    if (typeof level !== "number" || !Number.isFinite(level) || level <= 0) {
      continue;
    }

    levels.push({
      level,
      centerX: center.x,
      centerY: center.y,
      radius: (fullRadius * level) / 100,
    });
  }

  if (levels.length === 0) {
    return null;
  }

  levels.sort((left, right) => left.level - right.level);

  return {
    center,
    reference,
    levels,
    fullRadius,
    trendLine: {
      x0: center.x,
      y0: center.y,
      x1: reference.x,
      y1: reference.y,
    },
  };
}

export function isPointNearFibCircle(
  x: number,
  y: number,
  circle: FibCircleLevel,
  tolerance: number,
): boolean {
  const distance = pointsDistance({ x, y }, { x: circle.centerX, y: circle.centerY });
  return Math.abs(distance - circle.radius) <= tolerance;
}

export function fillFibCircleBand(
  ctx: CanvasRenderingContext2D,
  outer: FibCircleLevel,
  inner: FibCircleLevel,
): void {
  ctx.beginPath();
  ctx.arc(outer.centerX, outer.centerY, Math.max(outer.radius, 0.5), 0, Math.PI * 2);
  ctx.arc(inner.centerX, inner.centerY, Math.max(inner.radius, 0.5), 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
}
