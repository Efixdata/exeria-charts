import type { Tick } from "@efixdata/exeria-chart";
import type { TwelveDataPriceEvent, TwelveDataPriceResponse } from "./types";

export function mapPriceResponseToTick(
  response: TwelveDataPriceResponse,
  fallbackStamp = Date.now(),
): Tick {
  const price = parseFloat(response.price ?? "0");

  return {
    stamp: fallbackStamp,
    c: price,
    price,
  };
}

export function mapPriceEventToTick(event: TwelveDataPriceEvent): Tick {
  const price =
    typeof event.price === "number"
      ? event.price
      : parseFloat(event.price ?? "0");
  const rawStamp = event.timestamp ?? Date.now();
  const stamp =
    rawStamp < 1_000_000_000_000 ? rawStamp * 1000 : rawStamp;

  return {
    stamp,
    c: price,
    price,
  };
}
