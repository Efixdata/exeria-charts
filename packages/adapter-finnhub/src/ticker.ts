import type { Tick } from "@efixdata/exeria-chart";
import type { FinnhubQuoteResponse, FinnhubTradeEvent } from "./types";

export function mapQuoteToTick(
  response: FinnhubQuoteResponse,
  fallbackStamp = Date.now(),
): Tick {
  const price = response.c ?? 0;
  const rawStamp = response.t ?? fallbackStamp;
  const stamp =
    rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

  return {
    stamp,
    c: price,
    price,
  };
}

export function mapTradeEventToTick(event: FinnhubTradeEvent): Tick {
  const price = event.p ?? 0;
  const rawStamp = event.t ?? Date.now();
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
