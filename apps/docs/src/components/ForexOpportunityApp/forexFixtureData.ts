import type { Candle } from "@efixdata/exeria-chart";
import type { ForexTimeframeId } from "./forexInstruments";
import { findForexTimeframe } from "./forexInstruments";
import { intervalToForexTimeframeId, loadStaticForexCandles } from "./forexStaticData";

const DEFAULT_TIMEFRAME: ForexTimeframeId = "h1";

export async function getFixtureCandles(
  symbol: string,
  timeframeId: ForexTimeframeId = DEFAULT_TIMEFRAME,
): Promise<Candle[]> {
  return loadStaticForexCandles(symbol, timeframeId);
}

export function getFixtureCandlesForInterval(symbol: string, interval: string): Promise<Candle[]> {
  return loadStaticForexCandles(symbol, intervalToForexTimeframeId(interval));
}

export function getDefaultFixtureTimeframe() {
  return findForexTimeframe(DEFAULT_TIMEFRAME);
}
