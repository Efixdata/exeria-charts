import { useEffect, useState } from "react";
import { BINANCE_REST_URL } from "../CryptoTerminalApp/binancePublicStreams";
import type { WatchlistItem } from "./constants";
import { loadEquityCsv, readSparklineFromCandles } from "./equityDataLoader";
import type { FintechMarketId } from "./marketPresets";

export type SparklineSeriesMap = Record<string, number[]>;

async function fetchCryptoSparkline(symbol: string): Promise<number[]> {
  const url = new URL(`${BINANCE_REST_URL}/api/v3/klines`);
  url.searchParams.set("symbol", symbol);
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

async function fetchEquitySparkline(symbol: string): Promise<number[]> {
  const candles = await loadEquityCsv(symbol);
  return readSparklineFromCandles(candles, 24);
}

export function useWatchlistSparklines(
  items: WatchlistItem[],
  marketId: FintechMarketId,
  refreshKey = 0,
  refreshMs = 60_000,
) {
  const [series, setSeries] = useState<SparklineSeriesMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let disposed = false;

    const load = async () => {
      setLoading(true);

      const entries = await Promise.all(
        items.map(async (item) => {
          try {
            const points =
              marketId === "equities"
                ? await fetchEquitySparkline(item.symbol)
                : await fetchCryptoSparkline(item.symbol);
            return [item.id, points] as const;
          } catch {
            return [item.id, []] as const;
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

    if (marketId === "crypto") {
      const interval = window.setInterval(() => void load(), refreshMs);
      return () => {
        disposed = true;
        window.clearInterval(interval);
      };
    }

    return () => {
      disposed = true;
    };
  }, [items, marketId, refreshKey, refreshMs]);

  return { series, loading };
}
