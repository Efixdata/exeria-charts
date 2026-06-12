import type { OrderBookLevel } from "./mockMarketData";

export const BINANCE_WS_URL = "wss://stream.binance.com:9443";
export const BINANCE_REST_URL = "https://api.binance.com";

export type BinanceDepthUpdate = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};

export type BinanceAggTrade = {
  e: "aggTrade";
  E: number;
  s: string;
  a: number;
  p: string;
  q: string;
  T: number;
  m: boolean;
};

export type TapeTrade = {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: number;
};

export function depthStreamName(symbol: string, levels = 10): string {
  return `${symbol.toLowerCase()}@depth${levels}@100ms`;
}

export function aggTradeStreamName(symbol: string): string {
  return `${symbol.toLowerCase()}@aggTrade`;
}

export function buildMultiplexWsUrl(streams: string[]): string {
  return `${BINANCE_WS_URL}/stream?streams=${streams.join("/")}`;
}

export function parseDepthLevels(levels: [string, string][]): OrderBookLevel[] {
  let total = 0;
  return levels.map(([priceStr, sizeStr]) => {
    const size = Number.parseFloat(sizeStr);
    total += size;
    return {
      price: Number.parseFloat(priceStr),
      size,
      total,
    };
  });
}

export function buildOrderBookFromDepth(update: BinanceDepthUpdate) {
  const bids = parseDepthLevels(update.bids);
  const asks = parseDepthLevels(update.asks);
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;
  const mid = bestAsk > 0 && bestBid > 0 ? (bestAsk + bestBid) / 2 : bestAsk || bestBid;
  const spreadBps = mid > 0 ? (spread / mid) * 10_000 : 0;

  return { bids, asks, spread, spreadBps };
}

export function parseAggTrade(trade: BinanceAggTrade): TapeTrade {
  return {
    id: `${trade.a}-${trade.T}`,
    price: Number.parseFloat(trade.p),
    size: Number.parseFloat(trade.q),
    side: trade.m ? "sell" : "buy",
    time: trade.T,
  };
}

export function eventLatencyMs(eventTime: number, receivedAt = Date.now()): number {
  return Math.max(0, receivedAt - eventTime);
}
