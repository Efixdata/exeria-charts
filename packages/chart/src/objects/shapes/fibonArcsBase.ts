import type { LegacyShapePoint } from "../../objectRuntimeBases";
import { pointsDistance } from "../../utils/objects-lib";

export interface FibArcLevel {
  level: number;
  centerX: number;
  centerY: number;
  radius: number;
  rotation: number;
}

export interface FibArcsGeometry {
  center: LegacyShapePoint;
  reference: LegacyShapePoint;
  levels: FibArcLevel[];
  trendLine: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  fullRadius: number;
}

export const FIBON_ARCS_DEFAULT_VALUES = [0, 23.6, 38.2, 50.0, 61.8, 78.6, 100];

export const FIBON_ARCS_DEFAULT_VALUES_STATE = [false, true, true, true, true, true, true];

export const FIBON_ARC_START_ANGLE_OFFSET = 0;
export const FIBON_ARC_SWEEP = Math.PI;

export function resolveFibonArcsGeometry(
  points: LegacyShapePoint[],
  values: number[],
  valuesState: Array<boolean | undefined>,
): FibArcsGeometry | null {
  if (points.length < 2) {
    return null;
  }

  const center = points[0];
  const reference = points[1];
  const deltaX = reference.x - center.x;
  const deltaY = reference.y - center.y;
  const fullRadius = pointsDistance(center, reference);
  if (fullRadius <= 0) {
    return null;
  }

  const apexAngle = Math.atan2(deltaY, deltaX);
  const rotation = apexAngle - Math.PI / 2;
  const levels: FibArcLevel[] = [];

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
      rotation,
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

export function resolveFibArcApexAngle(arc: FibArcLevel): number {
  return arc.rotation + Math.PI / 2;
}

export function resolveFibArcLabelPoint(arc: FibArcLevel): { x: number; y: number } {
  const apexAngle = resolveFibArcApexAngle(arc);
  return {
    x: arc.centerX + arc.radius * Math.cos(apexAngle),
    y: arc.centerY + arc.radius * Math.sin(apexAngle),
  };
}

export function isAngleWithinFibArcSweep(
  angle: number,
  rotation: number,
  tolerance = 0,
): boolean {
  let relative = angle - rotation;
  while (relative < 0) {
    relative += Math.PI * 2;
  }
  while (relative >= Math.PI * 2) {
    relative -= Math.PI * 2;
  }

  return relative >= -tolerance && relative <= FIBON_ARC_SWEEP + tolerance;
}

export function isPointNearFibArc(
  x: number,
  y: number,
  arc: FibArcLevel,
  tolerance: number,
): boolean {
  const radius = Math.max(arc.radius, 0.5);
  const distance = pointsDistance({ x, y }, { x: arc.centerX, y: arc.centerY });
  if (Math.abs(distance - radius) > tolerance) {
    return false;
  }

  const angle = Math.atan2(y - arc.centerY, x - arc.centerX);
  const angularTolerance = tolerance / radius;
  return isAngleWithinFibArcSweep(angle, arc.rotation, angularTolerance);
}

export function fillFibArcBand(
  ctx: CanvasRenderingContext2D,
  outer: FibArcLevel,
  inner: FibArcLevel,
): void {
  const outerRadius = Math.max(outer.radius, 0.5);
  const innerRadius = Math.max(inner.radius, 0.5);
  const startAngle = outer.rotation + FIBON_ARC_START_ANGLE_OFFSET;
  const endAngle = startAngle + FIBON_ARC_SWEEP;

  ctx.beginPath();
  ctx.arc(outer.centerX, outer.centerY, outerRadius, startAngle, endAngle);
  ctx.arc(inner.centerX, inner.centerY, innerRadius, endAngle, startAngle, true);
  ctx.closePath();
  ctx.fill();
}

export function strokeFibArc(
  ctx: CanvasRenderingContext2D,
  arc: FibArcLevel,
): void {
  const radius = Math.max(arc.radius, 0.5);
  const startAngle = arc.rotation + FIBON_ARC_START_ANGLE_OFFSET;
  const endAngle = startAngle + FIBON_ARC_SWEEP;

  ctx.beginPath();
  ctx.arc(arc.centerX, arc.centerY, radius, startAngle, endAngle);
  ctx.stroke();
}
