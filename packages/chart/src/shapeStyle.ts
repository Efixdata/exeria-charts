import type { ChartRuntimeObject } from "./internal-types/objects";

export function resolveShapeOpacity(object: ChartRuntimeObject | Record<string, unknown>): number {
  const opacity = (object as { opacity?: unknown }).opacity;
  if (typeof opacity !== "number" || !Number.isFinite(opacity)) {
    return 1;
  }

  return Math.min(1, Math.max(0, opacity));
}

export function isShapeLocked(object: ChartRuntimeObject | Record<string, unknown>): boolean {
  return (object as { locked?: unknown }).locked === true;
}

export function withShapeOpacity<T>(
  ctx: CanvasRenderingContext2D,
  object: ChartRuntimeObject | Record<string, unknown>,
  draw: () => T,
): T {
  const opacity = resolveShapeOpacity(object);
  if (opacity >= 1) {
    return draw();
  }

  const previousAlpha = ctx.globalAlpha;
  ctx.globalAlpha = previousAlpha * opacity;

  try {
    return draw();
  } finally {
    ctx.globalAlpha = previousAlpha;
  }
}
