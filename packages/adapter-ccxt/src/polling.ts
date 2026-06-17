import type { Exchange } from "ccxt";
import type { Tick } from "@efixdata/exeria-chart";
import { mapTickerToTick } from "./ohlcv";
import { toCcxtSymbol } from "./symbol";

export function startTickerPolling(
  exchange: Exchange,
  symbol: string,
  pollIntervalMs: number,
  onTick: (update: Tick) => void,
  onError?: (error: unknown) => void,
): () => void {
  let active = true;
  let timer: ReturnType<typeof setInterval> | undefined;

  const poll = async () => {
    if (!active) {
      return;
    }

    try {
      const unifiedSymbol = toCcxtSymbol(symbol, exchange);
      const ticker = await exchange.fetchTicker(unifiedSymbol);
      onTick(mapTickerToTick(ticker));
    } catch (error) {
      onError?.(error);
    }
  };

  void poll();
  timer = setInterval(() => {
    void poll();
  }, pollIntervalMs);

  return () => {
    active = false;
    if (timer) {
      clearInterval(timer);
    }
  };
}
