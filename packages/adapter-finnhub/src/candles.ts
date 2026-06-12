import type { Candle } from "@efixdata/exeria-chart";
import type { FinnhubCandlesResponse } from "./types";

export function mapParallelArraysToCandles(
  response: FinnhubCandlesResponse,
): Candle[] {
  const timestamps = response.t ?? [];
  const opens = response.o ?? [];
  const highs = response.h ?? [];
  const lows = response.l ?? [];
  const closes = response.c ?? [];
  const volumes = response.v ?? [];

  const candles: Candle[] = [];

  for (let index = 0; index < timestamps.length; index++) {
    const rawStamp = timestamps[index] ?? 0;
    const stamp = rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

    candles.push({
      stamp,
      o: opens[index] ?? 0,
      h: highs[index] ?? 0,
      l: lows[index] ?? 0,
      c: closes[index] ?? 0,
      v: volumes[index] ?? 0,
    });
  }

  return candles.sort((a, b) => a.stamp - b.stamp);
}

export function mapFinnhubCandlesResponse(
  response: FinnhubCandlesResponse,
): Candle[] {
  if (response.s === "no_data") {
    return [];
  }

  if (response.s !== "ok") {
    throw new Error(`Finnhub candle error: ${response.s}`);
  }

  return mapParallelArraysToCandles(response);
}
