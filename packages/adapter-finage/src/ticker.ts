import type { Tick } from "@efixdata/exeria-chart";
import type { FinageLastQuoteResponse, FinagePriceEvent } from "./types";

export function mapLastQuoteToTick(
  response: FinageLastQuoteResponse,
  fallbackStamp = Date.now(),
): Tick {
  const ask = response.ask ?? 0;
  const bid = response.bid ?? 0;
  const price = ask > 0 && bid > 0 ? (ask + bid) / 2 : ask || bid;
  const rawStamp = response.timestamp ?? fallbackStamp;
  const stamp =
    rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

  return {
    stamp,
    c: price,
    price,
  };
}

export function mapPriceEventToTick(event: FinagePriceEvent): Tick {
  const price =
    event.a !== undefined && event.b !== undefined
      ? (event.a + event.b) / 2
      : typeof event.p === "number"
        ? event.p
        : parseFloat(event.p ?? "0");
  const rawStamp = event.t ?? Date.now();
  const stamp =
    rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

  return {
    stamp,
    c: price,
    price,
  };
}
