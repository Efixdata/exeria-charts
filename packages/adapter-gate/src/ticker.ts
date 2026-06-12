import type { Tick } from "@efixdata/exeria-chart";
import type { GateTicker } from "./types";

export function mapGateTickerToTick(ticker: GateTicker): Tick {
  const price = parseFloat(ticker.last ?? "0");

  return {
    stamp: Date.now(),
    c: price,
    price,
  };
}
