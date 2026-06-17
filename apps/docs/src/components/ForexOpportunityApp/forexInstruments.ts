import type { Interval } from "@efixdata/exeria-chart";

export type ForexTimeframeId = "m15" | "h1";

export type ForexPairMeta = {
  id: string;
  label: string;
  buttonLabel: string;
  priceDecimals: number;
  /** Fixture scaling anchor when live feed unavailable */
  fixtureBase: number;
};

export const FOREX_PAIRS: ForexPairMeta[] = [
  { id: "EUR/USD", label: "Euro / US Dollar", buttonLabel: "EURUSD", priceDecimals: 5, fixtureBase: 1.084 },
  { id: "GBP/USD", label: "British Pound / US Dollar", buttonLabel: "GBPUSD", priceDecimals: 5, fixtureBase: 1.268 },
  { id: "USD/JPY", label: "US Dollar / Japanese Yen", buttonLabel: "USDJPY", priceDecimals: 3, fixtureBase: 149.2 },
  { id: "USD/CHF", label: "US Dollar / Swiss Franc", buttonLabel: "USDCHF", priceDecimals: 5, fixtureBase: 0.884 },
  { id: "EUR/GBP", label: "Euro / British Pound", buttonLabel: "EURGBP", priceDecimals: 5, fixtureBase: 0.855 },
];

export const FOREX_TIMEFRAMES: Array<{
  id: ForexTimeframeId;
  label: string;
  interval: string;
  milis: number;
}> = [
  { id: "m15", label: "M15", interval: "15m", milis: 15 * 60 * 1000 },
  { id: "h1", label: "H1", interval: "1h", milis: 60 * 60 * 1000 },
];

export function findForexPair(id: string): ForexPairMeta {
  return (
    FOREX_PAIRS.find((pair) => pair.id === id) ?? {
      id,
      label: id,
      buttonLabel: id.replace("/", ""),
      priceDecimals: 5,
      fixtureBase: 1,
    }
  );
}

export function findForexTimeframe(id: ForexTimeframeId) {
  return FOREX_TIMEFRAMES.find((tf) => tf.id === id) ?? FOREX_TIMEFRAMES[0]!;
}

export function toChartInterval(timeframeId: ForexTimeframeId): Interval {
  const tf = findForexTimeframe(timeframeId);
  return { symbol: tf.interval, milis: tf.milis };
}

export function formatForexPrice(value: number, symbol: string): string {
  const decimals = findForexPair(symbol).priceDecimals;
  return value.toFixed(decimals);
}
