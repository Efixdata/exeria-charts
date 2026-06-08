import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type { LegacyValueLevelsShapeObject } from "../../objectRuntimeBases";

export interface FibonTimeZoneLine {
  x: number;
  index: number;
  label: string;
  fibonacci: number;
}

/** Classic Fibonacci sequence F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). */
export function fibonacciNumber(sequenceIndex: number): number {
  if (sequenceIndex <= 0) {
    return 0;
  }
  if (sequenceIndex === 1) {
    return 1;
  }

  let previous = 0;
  let current = 1;
  for (let step = 2; step <= sequenceIndex; step += 1) {
    const next = previous + current;
    previous = current;
    current = next;
  }
  return current;
}

export function buildFibonacciSequence(count: number): number[] {
  const sequence: number[] = [];
  for (let index = 0; index < count; index += 1) {
    sequence.push(fibonacciNumber(index));
  }
  return sequence;
}

/** Default Fibonacci time levels: 0, 1, 1, 2, 3, 5, 8, 13, … */
export const FIBON_TIME_ZONE_DEFAULT_VALUES = buildFibonacciSequence(17);

export const FIBON_TIME_ZONE_DEFAULT_VALUES_STATE = [
  true,
  true,
  true,
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
  false,
  false,
  false,
  false,
];

function formatFibonacciLabel(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function resolveFibonTimeZoneLines(
  object: LegacyValueLevelsShapeObject,
  pts: LegacyShapePoint[],
  renderer: {
    getIndexPoint(index: number, model: unknown): number;
  },
  model: { _midOffset: number },
): FibonTimeZoneLine[] {
  if (!pts || pts.length < 2) {
    return [];
  }

  const values = Array.isArray(object.values) ? object.values : FIBON_TIME_ZONE_DEFAULT_VALUES;
  const valuesState = Array.isArray(object.valuesState)
    ? object.valuesState
    : FIBON_TIME_ZONE_DEFAULT_VALUES_STATE;

  const startIndex = pts[0].index;
  const unit = pts[1].index - pts[0].index;
  if (unit === 0) {
    return [];
  }

  const lines: FibonTimeZoneLine[] = [];
  const seen = new Set<number>();

  for (let index = 0; index < values.length; index += 1) {
    if (valuesState[index] !== true) {
      continue;
    }

    const rawValue = values[index];
    if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
      continue;
    }

    const fibonacci = rawValue;
    const lineIndex = Math.round(startIndex + fibonacci * unit);
    if (seen.has(lineIndex)) {
      continue;
    }
    seen.add(lineIndex);

    lines.push({
      index: lineIndex,
      x: renderer.getIndexPoint(lineIndex, model) + model._midOffset,
      fibonacci,
      label: formatFibonacciLabel(fibonacci),
    });
  }

  lines.sort((a, b) => a.x - b.x);
  return lines;
}
