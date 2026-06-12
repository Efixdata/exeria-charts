export type OrderBookLevel = {
  price: number;
  size: number;
  total: number;
};

export type MockTrade = {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  time: number;
};

export type SimulatedOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  price: number;
  size: number;
  placedAt: number;
  parentId?: string;
  bracketType?: "SL" | "TP";
};

export type OpenPosition = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  entryPrice: number;
  size: number;
  openedAt: number;
};

/** @deprecated Use SimulatedOrder */
export type SimulatedPosition = SimulatedOrder;

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i += 1) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function buildOrderBook(midPrice: number, symbol: string): {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
} {
  const seed = hashSymbol(symbol);
  const tick = midPrice >= 1000 ? 0.1 : midPrice >= 100 ? 0.01 : 0.0001;
  const levels = 12;
  const bids: OrderBookLevel[] = [];
  const asks: OrderBookLevel[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < levels; i += 1) {
    const bidSize = 0.04 + ((seed + i * 17) % 40) / 100;
    const askSize = 0.03 + ((seed + i * 23) % 35) / 100;
    bidTotal += bidSize;
    askTotal += askSize;

    bids.push({
      price: midPrice - tick * (i + 1),
      size: bidSize,
      total: bidTotal,
    });
    asks.push({
      price: midPrice + tick * (i + 1),
      size: askSize,
      total: askTotal,
    });
  }

  const spread = asks[0]!.price - bids[0]!.price;
  const spreadBps = (spread / midPrice) * 10_000;

  return { bids, asks, spread, spreadBps };
}

export function createMockTrade(
  price: number,
  symbol: string,
  side: "buy" | "sell",
): MockTrade {
  const seed = hashSymbol(symbol) + Date.now();
  const size = 0.002 + (seed % 80) / 10_000;

  return {
    id: `${symbol}-${Date.now()}-${seed % 1000}`,
    price,
    size,
    side,
    time: Date.now(),
  };
}

function hashSymbolSeed(symbolId: string): number {
  let hash = 0;
  for (let index = 0; index < symbolId.length; index += 1) {
    hash = (hash * 31 + symbolId.charCodeAt(index)) % 997;
  }
  return hash;
}

export function buildSparklinePoints(changePercent: number, symbolId = ""): number[] {
  const points: number[] = [];
  const seed = hashSymbolSeed(symbolId);
  const phase = (seed % 11) * 0.55;
  const drift = changePercent >= 0 ? 0.22 : -0.22;
  let value = 42 + (seed % 17);

  for (let index = 0; index < 24; index += 1) {
    const noise =
      Math.sin(index * 0.95 + phase) * 1.8 +
      Math.cos(index * 0.52 + phase * 1.4) * 1.1 +
      Math.sin(index * 1.7 + seed * 0.03) * 0.7;
    value = Math.max(6, Math.min(94, value + drift + noise * 0.42));
    points.push(value);
  }

  return points;
}
