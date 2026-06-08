import LIB from "../../utils/chartingCommons";
import type { LegacyShapeObject, LegacyShapePoint } from "../../objectRuntimeBases";
import { resolveGannRect, type GannRect } from "./gannBase";

export interface VolumeProfileRow {
  index: number;
  priceLow: number;
  priceHigh: number;
  yTop: number;
  yBottom: number;
  volume: number;
}

export interface VolumeProfileGeometry {
  rect: GannRect;
  rows: VolumeProfileRow[];
  maxVolume: number;
  totalVolume: number;
  pocIndex: number;
  valueAreaHighIndex: number;
  valueAreaLowIndex: number;
  pocY: number;
  valueAreaHighY: number;
  valueAreaLowY: number;
  startIndex: number;
  endIndex: number;
}

export const VOLUME_PROFILE_DEFAULT_VALUE_AREA_PERCENT = 70;
export const VOLUME_PROFILE_MIN_ROWS = 24;
export const VOLUME_PROFILE_MAX_ROWS = 200;

function resolveProfileRowCount(rectHeight: number, requestedRows: unknown): number {
  const parsed =
    typeof requestedRows === "number" && Number.isFinite(requestedRows) ? requestedRows : 0;
  if (parsed > 0) {
    return Math.min(VOLUME_PROFILE_MAX_ROWS, Math.max(VOLUME_PROFILE_MIN_ROWS, Math.round(parsed)));
  }

  return Math.min(
    VOLUME_PROFILE_MAX_ROWS,
    Math.max(VOLUME_PROFILE_MIN_ROWS, Math.floor(rectHeight / 4)),
  );
}

function resolvePriceBounds(
  rect: GannRect,
  renderer: {
    getPriceForYCoordinate(y: number, options: Record<string, unknown>): number;
  },
  panel: {
    _height: number;
    _offset: number;
    vMin: number;
    vMax: number;
    valueAxisMode: unknown;
  },
  referenceValue: unknown,
): { priceMin: number; priceMax: number } {
  const priceOptions = {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV: referenceValue,
  };

  const topPrice = renderer.getPriceForYCoordinate(rect.top - panel._offset, priceOptions);
  const bottomPrice = renderer.getPriceForYCoordinate(rect.bottom - panel._offset, priceOptions);

  return {
    priceMin: Math.min(topPrice, bottomPrice),
    priceMax: Math.max(topPrice, bottomPrice),
  };
}

function priceToRowIndex(
  price: number,
  priceMin: number,
  priceMax: number,
  rowCount: number,
): number {
  if (priceMax === priceMin) {
    return 0;
  }

  const ratio = (priceMax - price) / (priceMax - priceMin);
  const clamped = Math.min(1, Math.max(0, ratio));
  const index = Math.floor(clamped * rowCount);
  return Math.min(rowCount - 1, Math.max(0, index));
}

function resolveValueAreaIndices(
  volumes: number[],
  pocIndex: number,
  totalVolume: number,
  valueAreaPercent: number,
): { highIndex: number; lowIndex: number } {
  if (volumes.length === 0 || totalVolume <= 0) {
    return { highIndex: pocIndex, lowIndex: pocIndex };
  }

  const targetVolume = (totalVolume * valueAreaPercent) / 100;
  let accumulated = volumes[pocIndex] ?? 0;
  let highIndex = pocIndex;
  let lowIndex = pocIndex;

  while (accumulated < targetVolume && (highIndex > 0 || lowIndex < volumes.length - 1)) {
    const nextHigh = highIndex > 0 ? volumes[highIndex - 1] ?? 0 : -1;
    const nextLow = lowIndex < volumes.length - 1 ? volumes[lowIndex + 1] ?? 0 : -1;

    if (nextHigh >= nextLow && highIndex > 0) {
      highIndex -= 1;
      accumulated += volumes[highIndex] ?? 0;
    } else if (lowIndex < volumes.length - 1) {
      lowIndex += 1;
      accumulated += volumes[lowIndex] ?? 0;
    } else if (highIndex > 0) {
      highIndex -= 1;
      accumulated += volumes[highIndex] ?? 0;
    } else {
      break;
    }
  }

  return { highIndex, lowIndex };
}

export function resolveFixedRangeVolumeProfileGeometry(
  object: LegacyShapeObject,
  points: LegacyShapePoint[],
  renderer: {
    getStampIndex(stamp: number, model: unknown, seriesManager: unknown): number;
    getPriceForYCoordinate(y: number, options: Record<string, unknown>): number;
  },
  model: { mainSeries: string; _leftIndex: number; _rightIndex: number },
  panel: {
    _height: number;
    _offset: number;
    vMin: number;
    vMax: number;
    valueAxisMode: unknown;
  },
  seriesManager: Record<string, { data: Array<Record<string, unknown>> }>,
): VolumeProfileGeometry | null {
  const rect = resolveGannRect(points);
  if (!rect || rect.width < 2 || rect.height < 2) {
    return null;
  }

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

  const referenceValue = LIB.getReferenceValue(
    object,
    model,
    seriesManager as Parameters<typeof LIB.getReferenceValue>[2],
  );
  const { priceMin, priceMax } = resolvePriceBounds(rect, renderer, panel, referenceValue);
  if (!Number.isFinite(priceMin) || !Number.isFinite(priceMax) || priceMax === priceMin) {
    return null;
  }

  const rowCount = resolveProfileRowCount(rect.height, (object as { profileRows?: unknown }).profileRows);
  const volumes = new Array<number>(rowCount).fill(0);
  const rowHeight = rect.height / rowCount;

  for (let index = startIndex; index <= endIndex; index += 1) {
    if (index < 0 || index >= mainSeries.data.length) {
      continue;
    }

    const candle = mainSeries.data[index];
    const volume = typeof candle.v === "number" && Number.isFinite(candle.v) ? candle.v : 0;
    if (volume <= 0) {
      continue;
    }

    const high = typeof candle.h === "number" ? candle.h : NaN;
    const low = typeof candle.l === "number" ? candle.l : NaN;
    const close = typeof candle.c === "number" ? candle.c : NaN;

    let clippedLow = Number.isFinite(low) ? low : close;
    let clippedHigh = Number.isFinite(high) ? high : close;

    if (!Number.isFinite(clippedLow) || !Number.isFinite(clippedHigh)) {
      continue;
    }

    if (clippedLow > clippedHigh) {
      const swapped = clippedLow;
      clippedLow = clippedHigh;
      clippedHigh = swapped;
    }

    clippedLow = Math.max(clippedLow, priceMin);
    clippedHigh = Math.min(clippedHigh, priceMax);

    if (clippedHigh < priceMin || clippedLow > priceMax) {
      continue;
    }

    if (clippedLow >= clippedHigh) {
      const rowIndex = priceToRowIndex(clippedLow, priceMin, priceMax, rowCount);
      volumes[rowIndex] += volume;
      continue;
    }

    const rowStart = priceToRowIndex(clippedHigh, priceMin, priceMax, rowCount);
    const rowEnd = priceToRowIndex(clippedLow, priceMin, priceMax, rowCount);
    const rowsSpanned = rowEnd - rowStart + 1;
    const volumePerRow = volume / rowsSpanned;

    for (let rowIndex = rowStart; rowIndex <= rowEnd; rowIndex += 1) {
      volumes[rowIndex] += volumePerRow;
    }
  }

  let maxVolume = 0;
  let totalVolume = 0;
  let pocIndex = 0;

  for (let index = 0; index < volumes.length; index += 1) {
    totalVolume += volumes[index];
    if (volumes[index] > maxVolume) {
      maxVolume = volumes[index];
      pocIndex = index;
    }
  }

  if (totalVolume <= 0 || maxVolume <= 0) {
    return null;
  }

  const valueAreaPercentRaw = (object as { valueAreaPercent?: unknown }).valueAreaPercent;
  const valueAreaPercent =
    typeof valueAreaPercentRaw === "number" && Number.isFinite(valueAreaPercentRaw)
      ? Math.min(100, Math.max(1, valueAreaPercentRaw))
      : VOLUME_PROFILE_DEFAULT_VALUE_AREA_PERCENT;
  const valueArea = resolveValueAreaIndices(volumes, pocIndex, totalVolume, valueAreaPercent);

  const rows: VolumeProfileRow[] = [];
  for (let index = 0; index < rowCount; index += 1) {
    const priceHigh = priceMax - (index / rowCount) * (priceMax - priceMin);
    const priceLow = priceMax - ((index + 1) / rowCount) * (priceMax - priceMin);
    rows.push({
      index,
      priceLow,
      priceHigh,
      yTop: rect.top + index * rowHeight,
      yBottom: rect.top + (index + 1) * rowHeight,
      volume: volumes[index],
    });
  }

  const pocRow = rows[pocIndex];
  const valueAreaHighRow = rows[valueArea.highIndex];
  const valueAreaLowRow = rows[valueArea.lowIndex];

  return {
    rect,
    rows,
    maxVolume,
    totalVolume,
    pocIndex,
    valueAreaHighIndex: valueArea.highIndex,
    valueAreaLowIndex: valueArea.lowIndex,
    pocY: (pocRow.yTop + pocRow.yBottom) / 2,
    valueAreaHighY: valueAreaHighRow.yTop,
    valueAreaLowY: valueAreaLowRow.yBottom,
    startIndex,
    endIndex,
  };
}
