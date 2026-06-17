import LIB from "../../utils/chartingCommons";
import type {
  LegacyShapeObject,
  LegacyShapePoint,
  LegacyValueLevelsShapeObject,
} from "../../objectRuntimeBases";

export interface RegressionSample {
  index: number;
  price: number;
}

export interface RegressionModel {
  slope: number;
  intercept: number;
  stdDev: number;
  pearsonR: number;
  count: number;
}

export interface RegressionChannelSegment {
  deviation: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  price0: number;
  price1: number;
}

export interface RegressionChannelGeometry {
  startIndex: number;
  endIndex: number;
  model: RegressionModel;
  segments: RegressionChannelSegment[];
  pearsonR: number;
}

export const REGRESSION_CHANNEL_DEFAULT_VALUES = [-2, -1, 0, 1, 2];

export const REGRESSION_CHANNEL_DEFAULT_VALUES_STATE = [true, false, true, false, true];

function resolveSourcePrice(candle: Record<string, unknown>, source: string): number | null {
  const open = typeof candle.o === "number" ? candle.o : NaN;
  const high = typeof candle.h === "number" ? candle.h : NaN;
  const low = typeof candle.l === "number" ? candle.l : NaN;
  const close = typeof candle.c === "number" ? candle.c : NaN;

  switch (source) {
    case "o":
      return Number.isFinite(open) ? open : null;
    case "h":
      return Number.isFinite(high) ? high : null;
    case "l":
      return Number.isFinite(low) ? low : null;
    case "hl2":
      return Number.isFinite(high) && Number.isFinite(low) ? (high + low) / 2 : null;
    case "hlc3":
      return Number.isFinite(high) && Number.isFinite(low) && Number.isFinite(close)
        ? (high + low + close) / 3
        : null;
    case "c":
    default:
      return Number.isFinite(close) ? close : null;
  }
}

export function computeLinearRegression(samples: RegressionSample[]): RegressionModel | null {
  const count = samples.length;
  if (count < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (const sample of samples) {
    sumX += sample.index;
    sumY += sample.price;
    sumXY += sample.index * sample.price;
    sumXX += sample.index * sample.index;
    sumYY += sample.price * sample.price;
  }

  const denominator = count * sumXX - sumX * sumX;
  if (denominator === 0) {
    return null;
  }

  const slope = (count * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / count;

  let sumSquaredResiduals = 0;
  for (const sample of samples) {
    const predicted = intercept + slope * sample.index;
    const residual = sample.price - predicted;
    sumSquaredResiduals += residual * residual;
  }

  const stdDev = Math.sqrt(sumSquaredResiduals / count);
  const pearsonNumerator = count * sumXY - sumX * sumY;
  const pearsonDenominator = Math.sqrt(
    (count * sumXX - sumX * sumX) * (count * sumYY - sumY * sumY),
  );
  const pearsonR = pearsonDenominator === 0 ? 0 : pearsonNumerator / pearsonDenominator;

  return {
    slope,
    intercept,
    stdDev,
    pearsonR,
    count,
  };
}

export function regressionPriceAt(
  model: RegressionModel,
  index: number,
  deviationMultiplier: number,
): number {
  return model.intercept + model.slope * index + deviationMultiplier * model.stdDev;
}

function collectRegressionSamples(
  object: LegacyShapeObject,
  renderer: {
    getStampIndex(stamp: number, model: unknown, seriesManager: unknown): number;
  },
  model: { mainSeries: string },
  seriesManager: Record<string, { data: Array<Record<string, unknown>> }>,
): { samples: RegressionSample[]; startIndex: number; endIndex: number } | null {
  if (!Array.isArray(object.anchors) || object.anchors.length < 2) {
    return null;
  }

  const indexA = renderer.getStampIndex(object.anchors[0].stamp, model, seriesManager);
  const indexB = renderer.getStampIndex(object.anchors[1].stamp, model, seriesManager);
  const startIndex = Math.min(indexA, indexB);
  const endIndex = Math.max(indexA, indexB);
  const mainSeries = seriesManager[model.mainSeries];

  if (!mainSeries?.data?.length || endIndex < startIndex) {
    return null;
  }

  const source = typeof object.source === "string" ? object.source : "c";
  const samples: RegressionSample[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (index < 0 || index >= mainSeries.data.length) {
      continue;
    }

    const price = resolveSourcePrice(mainSeries.data[index], source);
    if (price == null) {
      continue;
    }

    samples.push({ index, price });
  }

  if (samples.length < 2) {
    return null;
  }

  return { samples, startIndex, endIndex };
}

export function resolveRegressionChannelGeometry(
  object: LegacyValueLevelsShapeObject,
  renderer: {
    getStampIndex(stamp: number, model: unknown, seriesManager: unknown): number;
    getIndexPoint(index: number, model: { _midOffset: number }): number;
    getYCoordinateForPrice(price: number, options: Record<string, unknown>): number;
  },
  model: { mainSeries: string; _midOffset: number },
  panel: {
    _height: number;
    _offset: number;
    vMin: number;
    vMax: number;
    valueAxisMode: unknown;
  },
  seriesManager: Record<string, { data: Array<Record<string, unknown>> }>,
): RegressionChannelGeometry | null {
  const sampleWindow = collectRegressionSamples(object, renderer, model, seriesManager);
  if (!sampleWindow) {
    return null;
  }

  const regressionModel = computeLinearRegression(sampleWindow.samples);
  if (!regressionModel) {
    return null;
  }

  const values = Array.isArray(object.values)
    ? object.values
    : REGRESSION_CHANNEL_DEFAULT_VALUES;
  const valuesState = Array.isArray(object.valuesState)
    ? object.valuesState
    : REGRESSION_CHANNEL_DEFAULT_VALUES_STATE;
  const referenceValue = LIB.getReferenceValue(object, model as never, seriesManager as never);
  const priceOptions = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV: referenceValue,
  };

  const x0 = renderer.getIndexPoint(sampleWindow.startIndex, model) + model._midOffset;
  const x1 = renderer.getIndexPoint(sampleWindow.endIndex, model) + model._midOffset;
  const segments: RegressionChannelSegment[] = [];

  for (let index = 0; index < values.length; index += 1) {
    if (valuesState[index] !== true) {
      continue;
    }

    const deviation = values[index];
    if (typeof deviation !== "number" || !Number.isFinite(deviation)) {
      continue;
    }

    const price0 = regressionPriceAt(regressionModel, sampleWindow.startIndex, deviation);
    const price1 = regressionPriceAt(regressionModel, sampleWindow.endIndex, deviation);
    const y0 = renderer.getYCoordinateForPrice(price0, priceOptions) + panel._offset;
    const y1 = renderer.getYCoordinateForPrice(price1, priceOptions) + panel._offset;

    segments.push({
      deviation,
      x0,
      y0,
      x1,
      y1,
      price0,
      price1,
    });
  }

  if (segments.length === 0) {
    return null;
  }

  segments.sort((left, right) => left.y0 - right.y0);

  return {
    startIndex: sampleWindow.startIndex,
    endIndex: sampleWindow.endIndex,
    model: regressionModel,
    segments,
    pearsonR: regressionModel.pearsonR,
  };
}

export function formatRegressionDeviationLabel(deviation: number): string {
  if (deviation === 0) {
    return "0";
  }

  const rounded =
    Number.isInteger(deviation) || Math.abs(deviation) >= 10
      ? String(deviation)
      : deviation.toFixed(1);

  return `${rounded}σ`;
}

function resolveCenterSegment(
  geometry: RegressionChannelGeometry,
): RegressionChannelSegment | null {
  const centerSegment = geometry.segments.find((segment) => segment.deviation === 0);
  if (centerSegment) {
    return centerSegment;
  }

  if (geometry.segments.length === 0) {
    return null;
  }

  const sortedSegments = [...geometry.segments].sort(
    (left, right) => left.deviation - right.deviation,
  );
  return sortedSegments[Math.floor(sortedSegments.length / 2)] ?? null;
}

export function snapRegressionChannelAnchorsToCenterLine(
  points: LegacyShapePoint[],
  geometry: RegressionChannelGeometry | null,
): LegacyShapePoint[] {
  if (!geometry || points.length < 2) {
    return points;
  }

  const centerSegment = resolveCenterSegment(geometry);
  if (!centerSegment) {
    return points;
  }

  return points.map((point) => {
    const atStart =
      typeof point.index === "number" && point.index === geometry.startIndex
        ? true
        : typeof point.index === "number" && point.index === geometry.endIndex
          ? false
          : Math.abs(point.x - centerSegment.x0) <= Math.abs(point.x - centerSegment.x1);

    return {
      ...point,
      y: atStart ? centerSegment.y0 : centerSegment.y1,
      value: atStart ? centerSegment.price0 : centerSegment.price1,
    };
  });
}

export function resolveRegressionChannelAnchorHitTolerance(
  hitTolerance: number,
  anchorPointSize: number,
  selected = false,
): number {
  const baseTolerance = Math.max(hitTolerance * 2, anchorPointSize * 4, 18);
  return selected ? baseTolerance + 8 : baseTolerance;
}

export function pickRegressionChannelAnchorIndex(
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
    const inCircle = distance <= tolerance;
    const inEndCap = dx <= tolerance && dy <= tolerance * 2;

    if (!inCircle && !inEndCap) {
      continue;
    }

    const score = distance + dx * 0.35;
    if (score < bestScore) {
      bestIndex = index;
      bestScore = score;
    }
  }

  return bestIndex;
}
