import { useEffect, useRef, useState } from "react";
import type { WatchlistSymbol } from "./constants";

export type WatchlistStat = {
  price: number;
  changePercent: number;
  volumeQuote: number;
  highPrice: number;
  lowPrice: number;
};

type WatchlistStatsMap = Record<string, WatchlistStat>;

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

export function useWatchlistStats(symbols: WatchlistSymbol[], refreshMs = 30_000) {
  const [stats, setStats] = useState<WatchlistStatsMap>({});
  const [loading, setLoading] = useState(true);
  const [tickerLatencyMs, setTickerLatencyMs] = useState<number | null>(null);
  const activeSymbolRef = useRef<string | null>(null);

  const patchActiveSymbol = (symbolId: string, price: number) => {
    activeSymbolRef.current = symbolId;
    setStats((current) => {
      const existing = current[symbolId];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [symbolId]: {
          ...existing,
          price,
        },
      };
    });
  };

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      const startedAt = Date.now();
      try {
        const symbolsParam = encodeURIComponent(
          JSON.stringify(symbols.map((item) => item.id)),
        );
        const response = await fetch(`${BINANCE_TICKER_URL}?symbols=${symbolsParam}`);
        if (!response.ok) {
          throw new Error("Ticker request failed");
        }

        const payload = (await response.json()) as Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          quoteVolume: string;
          highPrice: string;
          lowPrice: string;
        }>;

        if (disposed) {
          return;
        }

        const next: WatchlistStatsMap = {};
        for (const row of payload) {
          next[row.symbol] = {
            price: Number.parseFloat(row.lastPrice),
            changePercent: Number.parseFloat(row.priceChangePercent),
            volumeQuote: Number.parseFloat(row.quoteVolume),
            highPrice: Number.parseFloat(row.highPrice),
            lowPrice: Number.parseFloat(row.lowPrice),
          };
        }

        setStats(next);
        setTickerLatencyMs(Date.now() - startedAt);
        setLoading(false);
      } catch {
        if (!disposed) {
          setLoading(false);
        }
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), refreshMs);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [refreshMs, symbols]);

  return { stats, loading, tickerLatencyMs, patchActiveSymbol };
}
