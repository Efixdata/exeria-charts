import type { Candle } from "@efixdata/exeria-chart";
import type { EodhdEodCandleRow, EodhdIntradayCandleRow } from "./types";

export function parseEodDateStamp(date: string): number {
  const parsed = Date.parse(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid EOD date: ${date}`);
  }

  return parsed;
}

export function parseIntradayStamp(row: EodhdIntradayCandleRow): number {
  if (row.timestamp !== undefined) {
    const raw = row.timestamp;
    return raw < 1_000_000_000_000 ? raw * 1000 : raw;
  }

  if (row.datetime) {
    const normalized = row.datetime.includes("T")
      ? row.datetime
      : row.datetime.replace(" ", "T") + "Z";
    const parsed = Date.parse(normalized);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  throw new Error("Intraday row is missing timestamp");
}

export function mapEodCandles(rows: EodhdEodCandleRow[]): Candle[] {
  const candles = rows.map((row) => ({
    stamp: parseEodDateStamp(row.date),
    o: row.open,
    h: row.high,
    l: row.low,
    c: row.close,
    v: row.volume ?? 0,
  }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}

export function mapIntradayCandles(rows: EodhdIntradayCandleRow[]): Candle[] {
  const candles = rows.map((row) => ({
    stamp: parseIntradayStamp(row),
    o: row.open,
    h: row.high,
    l: row.low,
    c: row.close,
    v: row.volume ?? 0,
  }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}
