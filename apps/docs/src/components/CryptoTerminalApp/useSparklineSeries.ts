import { useEffect, useState } from "react";
import { BINANCE_REST_URL } from "./binancePublicStreams";
import type { WatchlistSymbol } from "./constants";

export type SparklineSeriesMap = Record<string, number[]>;

async function fetchSparkline(symbolId: string): Promise<number[]> {
  const url = new URL(`${BINANCE_REST_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbolId);
  url.searchParams.set("interval", "1h");
  url.searchParams.set("limit", "24");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Klines request failed");
  }

  const payload = (await response.json()) as Array<[string, string, string, string, string, string]>;
  return payload
    .map((row) => Number.parseFloat(row[4]))
    .filter((close) => Number.isFinite(close));
}

export function useSparklineSeries(symbols: WatchlistSymbol[], refreshMs = 60_000) {
  const [series, setSeries] = useState<SparklineSeriesMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      const entries = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const points = await fetchSparkline(symbol.id);
            return [symbol.id, points] as const;
          } catch {
            return [symbol.id, []] as const;
          }
        }),
      );

      if (disposed) {
        return;
      }

      setSeries(Object.fromEntries(entries));
      setLoading(false);
    };

    void load();
    const interval = window.setInterval(() => void load(), refreshMs);

    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [refreshMs, symbols]);

  return { series, loading };
}
