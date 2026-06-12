export type SignalSide = "buy" | "sell";

export type SignalStrength = "strong" | "moderate" | "weak";

export type SignalEvent = {
  id: string;
  symbol: string;
  side: SignalSide;
  strategy: string;
  price: number;
  timestamp: number;
  reasoning: string;
  confluence: number;
  strength: SignalStrength;
};

type SignalSeed = Omit<SignalEvent, "id" | "symbol" | "timestamp">;

const SEED: Record<string, SignalSeed[]> = {
  BTCUSDT: [
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 67240,
      confluence: 78,
      strength: "strong",
      reasoning: "MACD line crossed above signal on rising volume. RSI recovered from 44 → 52 without hitting overbought.",
    },
    {
      side: "sell",
      strategy: "Volatility Breakout",
      price: 68120,
      confluence: -61,
      strength: "moderate",
      reasoning: "Close pierced upper Bollinger band after 3-session squeeze. Mean-reversion risk elevated short term.",
    },
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 66890,
      confluence: 71,
      strength: "moderate",
      reasoning: "Bullish crossover confirmed with price holding above session VWAP. Momentum panel turning positive.",
    },
  ],
  ETHUSDT: [
    {
      side: "sell",
      strategy: "Volatility Breakout",
      price: 3521,
      confluence: -68,
      strength: "strong",
      reasoning: "Band exceed on heavy sell volume. RSI divergence vs price high — distribution pattern forming.",
    },
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 3468,
      confluence: 64,
      strength: "moderate",
      reasoning: "MACD cross up from oversold zone. ETH/BTC ratio stabilizing — relative strength improving.",
    },
  ],
  SOLUSDT: [
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 148.2,
      confluence: 82,
      strength: "strong",
      reasoning: "Clean momentum cross with expanding range. Volume 1.4× 20-day average — breakout participation.",
    },
    {
      side: "sell",
      strategy: "Volatility Breakout",
      price: 152.4,
      confluence: -55,
      strength: "moderate",
      reasoning: "Upper band tag after parabolic extension. RSI above 72 — short-term exhaustion signal.",
    },
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 145.8,
      confluence: 59,
      strength: "weak",
      reasoning: "Early cross signal — awaiting volume confirmation. Confluence below strong-buy threshold.",
    },
  ],
  BNBUSDT: [
    {
      side: "sell",
      strategy: "Volatility Breakout",
      price: 612.4,
      confluence: -57,
      strength: "moderate",
      reasoning: "Failed retest of prior high + band exceed. Momentum histogram rolling over.",
    },
  ],
  XRPUSDT: [
    {
      side: "buy",
      strategy: "Momentum Cross",
      price: 0.62,
      confluence: 66,
      strength: "moderate",
      reasoning: "Cross confirmed near multi-week base. Social/news flow neutral — technical-led signal.",
    },
  ],
  ADAUSDT: [],
};

const CONFLUENCE_BASE: Record<string, number> = {
  BTCUSDT: 34,
  ETHUSDT: -22,
  SOLUSDT: 71,
  BNBUSDT: -18,
  XRPUSDT: 41,
  ADAUSDT: 8,
};

function minutesAgo(minutes: number): number {
  return Date.now() - minutes * 60_000;
}

export function getMockSignalsForSymbol(symbol: string): SignalEvent[] {
  const entries = SEED[symbol] ?? [];
  return entries
    .map((entry, index) => ({
      ...entry,
      id: `${symbol}-${index}`,
      symbol,
      timestamp: minutesAgo((entries.length - index) * 17 + 4),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getAllMockSignals(): SignalEvent[] {
  return Object.keys(SEED)
    .flatMap((symbol) => getMockSignalsForSymbol(symbol))
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function getBullishSignals(limit = 4): SignalEvent[] {
  return getAllMockSignals()
    .filter((event) => event.side === "buy")
    .sort((a, b) => b.confluence - a.confluence)
    .slice(0, limit);
}

export function getBearishSignals(limit = 4): SignalEvent[] {
  return getAllMockSignals()
    .filter((event) => event.side === "sell")
    .sort((a, b) => a.confluence - b.confluence)
    .slice(0, limit);
}

export function countRecentSignals(symbol: string, windowMs = 6 * 60 * 60_000): number {
  const cutoff = Date.now() - windowMs;
  return getMockSignalsForSymbol(symbol).filter((event) => event.timestamp >= cutoff).length;
}

export function getLastSignalForSymbol(symbol: string): SignalEvent | undefined {
  return getMockSignalsForSymbol(symbol)[0];
}

export function getConfluenceForSymbol(symbol: string): number {
  const last = getLastSignalForSymbol(symbol);
  if (last) {
    return last.confluence;
  }
  return CONFLUENCE_BASE[symbol] ?? 0;
}

export function formatConfluence(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function getConfluenceLabel(value: number): string {
  if (value >= 75) {
    return "Strong buy";
  }
  if (value >= 55) {
    return "Buy";
  }
  if (value <= -75) {
    return "Strong sell";
  }
  if (value <= -55) {
    return "Sell";
  }
  return "Neutral / hold";
}

export function formatSignalTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatSignalAge(timestamp: number): string {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
}
