import type { Tick } from "@efixdata/exeria-chart";
import type { CoinbaseMarketTrade, CoinbaseTickerResponse } from "./types";

export function mapTradeToTick(trade: CoinbaseMarketTrade): Tick {
  const price = parseFloat(trade.price ?? "0");
  const stamp = parseTradeTime(trade.time);

  return {
    stamp,
    c: price,
    price,
    v: parseFloat(trade.size ?? "0"),
  };
}

export function mapTickerResponseToTick(
  response: CoinbaseTickerResponse,
  fallbackStamp = Date.now(),
): Tick {
  const trade = response.trades?.[0];
  if (trade?.price) {
    return mapTradeToTick(trade);
  }

  const bid = parseFloat(response.best_bid ?? "0");
  const ask = parseFloat(response.best_ask ?? "0");
  const price = bid > 0 && ask > 0 ? (bid + ask) / 2 : bid || ask;

  return {
    stamp: fallbackStamp,
    c: price,
    price,
  };
}

function parseTradeTime(value?: string): number {
  if (!value) {
    return Date.now();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}
