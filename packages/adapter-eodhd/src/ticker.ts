import type { Tick } from "@efixdata/exeria-chart";
import type { EodhdRealTimeResponse } from "./types";

export function mapRealTimeToTick(
  response: EodhdRealTimeResponse,
  fallbackStamp = Date.now(),
): Tick {
  const price = response.close ?? 0;
  const rawStamp = response.timestamp ?? fallbackStamp;
  const stamp =
    rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

  return {
    stamp,
    c: price,
    price,
  };
}

export function mapLastCandleToTick(candle: {
  stamp: number;
  c: number;
}): Tick {
  return {
    stamp: candle.stamp,
    c: candle.c,
    price: candle.c,
  };
}
