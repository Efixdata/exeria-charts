import type { Candle } from "@efixdata/exeria-chart";
import type { TwelveDataTimeSeriesValue } from "./types";

export function parseTwelveDataDatetime(datetime: string): number {
  const normalized = datetime.trim();

  if (/^\d+$/.test(normalized)) {
    const numeric = Number(normalized);
    return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
  }

  const isoLike = normalized.includes("T")
    ? normalized
    : normalized.replace(" ", "T");

  const parsed = Date.parse(isoLike.endsWith("Z") ? isoLike : `${isoLike}Z`);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function mapTimeSeriesValuesToCandles(
  values: TwelveDataTimeSeriesValue[],
): Candle[] {
  const candles = values.map((bar) => ({
    stamp: parseTwelveDataDatetime(bar.datetime),
    o: parseFloat(bar.open),
    h: parseFloat(bar.high),
    l: parseFloat(bar.low),
    c: parseFloat(bar.close),
    v: bar.volume ? parseFloat(bar.volume) : 0,
  }));

  return candles.sort((a, b) => a.stamp - b.stamp);
}
