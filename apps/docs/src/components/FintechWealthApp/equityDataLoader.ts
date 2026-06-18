import type { Candle } from "@efixdata/exeria-chart";
import { MIN_CHART_BARS, type FintechPeriodId } from "./constants";

const EQUITY_CSV_BASE = "/data/fintech-equity";

type CsvRow = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type EquityPeriodSlice = {
  sourceDays: number;
  chartBars: number;
};

const EQUITY_PERIOD_SLICES: Record<FintechPeriodId, EquityPeriodSlice> = {
  "1d": { sourceDays: 30, chartBars: MIN_CHART_BARS },
  "1w": { sourceDays: 45, chartBars: MIN_CHART_BARS },
  "1m": { sourceDays: 80, chartBars: MIN_CHART_BARS },
  "3m": { sourceDays: 150, chartBars: MIN_CHART_BARS },
  "1y": { sourceDays: 252, chartBars: 252 },
  max: { sourceDays: Number.POSITIVE_INFINITY, chartBars: 0 },
};

const csvCache = new Map<string, Candle[]>();

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  const rows: CsvRow[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line) {
      continue;
    }

    const [date, open, high, low, close, volume] = line.split(",");
    if (!date || !open || !high || !low || !close) {
      continue;
    }

    rows.push({
      date,
      open: Number.parseFloat(open),
      high: Number.parseFloat(high),
      low: Number.parseFloat(low),
      close: Number.parseFloat(close),
      volume: Number.parseFloat(volume ?? "0"),
    });
  }

  return rows;
}

function rowsToCandles(rows: CsvRow[]): Candle[] {
  return rows.map((row) => ({
    stamp: Date.parse(`${row.date}T00:00:00Z`),
    o: row.open,
    h: row.high,
    l: row.low,
    c: row.close,
    v: row.volume,
  }));
}

function downsampleCandles(candles: Candle[], targetCount: number): Candle[] {
  if (candles.length <= targetCount) {
    return candles;
  }

  const result: Candle[] = [];
  for (let index = 0; index < targetCount; index += 1) {
    const sourceIndex = Math.round((index / (targetCount - 1)) * (candles.length - 1));
    result.push(candles[sourceIndex]!);
  }

  return result;
}

function expandCandlesToCount(candles: Candle[], targetCount: number): Candle[] {
  if (candles.length === 0 || targetCount <= 0) {
    return candles;
  }

  if (candles.length === 1) {
    const day = candles[0]!;
    const stepMs = Math.max(1, Math.floor((24 * 60 * 60 * 1000) / targetCount));
    const result: Candle[] = [];

    for (let index = 0; index < targetCount; index += 1) {
      const t = index / Math.max(1, targetCount - 1);
      const close = day.o + (day.c - day.o) * t;
      const open = index === 0 ? day.o : result[index - 1]!.c;
      result.push({
        stamp: day.stamp + index * stepMs,
        o: open,
        h: Math.max(open, close, day.h),
        l: Math.min(open, close, day.l),
        c: close,
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
        v: day.v / targetCount,
      });
    }

    return result;
  }

  const result: Candle[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const position = (index / Math.max(1, targetCount - 1)) * (candles.length - 1);
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.min(lowerIndex + 1, candles.length - 1);
    const blend = position - lowerIndex;
    const lower = candles[lowerIndex]!;
    const upper = candles[upperIndex]!;
    const stamp = lower.stamp + blend * (upper.stamp - lower.stamp);
    const close = lower.c + blend * (upper.c - lower.c);
    const open = index === 0 ? lower.o : result[index - 1]!.c;

    result.push({
      stamp,
      o: open,
      h: Math.max(open, close, lower.h, upper.h),
    // @ts-ignore
      l: Math.min(open, close, lower.l, upper.l),
    // @ts-ignore
    // @ts-ignore
      c: close,
    // @ts-ignore
    // @ts-ignore
      v: (lower.v + upper.v) / 2 / targetCount,
    });
  }

  return result;
}

export function fitCandlesToChartBars(candles: Candle[], targetCount: number): Candle[] {
  if (targetCount <= 0 || candles.length === 0) {
    return candles;
  }

  if (candles.length === targetCount) {
    return candles;
  }

  if (candles.length > targetCount) {
    return downsampleCandles(candles, targetCount);
  }

  return expandCandlesToCount(candles, targetCount);
}

export async function loadEquityCsv(symbol: string): Promise<Candle[]> {
  const cached = csvCache.get(symbol);
  if (cached) {
    return cached;
  }

  const response = await fetch(`${EQUITY_CSV_BASE}/${symbol}.csv`);
  if (!response.ok) {
    throw new Error(`Failed to load equity fixture for ${symbol}`);
  }

  const text = await response.text();
  const candles = rowsToCandles(parseCsv(text));
  csvCache.set(symbol, candles);
  return candles;
}

export function sliceCandlesForPeriod(candles: Candle[], periodId: FintechPeriodId): Candle[] {
  if (candles.length === 0) {
    return candles;
  }

  const { sourceDays, chartBars } = EQUITY_PERIOD_SLICES[periodId];
  const source =
    Number.isFinite(sourceDays) && sourceDays > 0
      ? candles.slice(-Math.min(sourceDays, candles.length))
      : candles;

  if (periodId === "max") {
    return source.length >= MIN_CHART_BARS ? source : fitCandlesToChartBars(source, MIN_CHART_BARS);
  }

  return fitCandlesToChartBars(source, Math.max(chartBars, MIN_CHART_BARS));
}

export function ensureMinimumChartBars(candles: Candle[], minimum = MIN_CHART_BARS): Candle[] {
  if (candles.length === 0 || candles.length >= minimum) {
    return candles;
  }

  return fitCandlesToChartBars(candles, minimum);
}

export function buildCanonicalStamps(candles: Candle[]): number[] {
  const fitted = ensureMinimumChartBars(candles);
  if (fitted.length === 0) {
    return [];
  }

  const first = fitted[0]!.stamp;
  const last = fitted[fitted.length - 1]!.stamp;

  if (fitted.length === 1) {
    return [first];
  }

  const step = (last - first) / (fitted.length - 1);
  return Array.from({ length: fitted.length }, (_, index) => Math.round(first + index * step));
}

export function normalizeCandlesToStamps(candles: Candle[], stamps: number[]): Candle[] {
  if (stamps.length === 0) {
    return candles;
  }

  const fitted = fitCandlesToChartBars(candles, stamps.length);
  return fitted.map((candle, index) => ({
    ...candle,
    stamp: stamps[index]!,
  }));
}

export async function loadEquityCandles(
  symbol: string,
  periodId: FintechPeriodId,
): Promise<Candle[]> {
  const all = await loadEquityCsv(symbol);
  return sliceCandlesForPeriod(all, periodId);
}

export function readSparklineFromCandles(candles: Candle[], points = 24): number[] {
  return candles
    .slice(-points)
    .map((candle) => candle.c)
    .filter((close) => Number.isFinite(close));
}
