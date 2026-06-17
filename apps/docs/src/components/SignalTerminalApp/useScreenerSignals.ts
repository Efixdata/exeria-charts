"use client";

import { useEffect, useState } from "react";
import { WATCHLIST_SYMBOLS } from "../CryptoTerminalApp/constants";
import { exceedBollingerDescription } from "./exceedBollingerCore";
import { macdCrossDescription } from "./macdCrossCore";
import {
  crossDescription,
  SMA_CROSS_PERIOD,
  SCREENER_INTERVAL_LABEL,
} from "./smaCrossCore";
import { getSymbolStrategy } from "./screenerStrategy";
import {
  findLastScreenerStrategySignal,
  type ScreenerStrategyHit,
} from "./screenerStrategyHits";
import type { ScreenerSignal } from "./signalCatalog";
import { fetchMiniChartCandles } from "./signalMiniChartData";

const HISTORY_LIMIT = 240;

function buildScreenerSignal(
  symbol: string,
  pair: string,
  hit: ScreenerStrategyHit,
): ScreenerSignal {
  const base = {
    symbol,
    pair,
    side: hit.side,
    signalPrice: hit.signalPrice,
    timestamp: hit.timestamp,
    source: "strategy" as const,
  };

  switch (getSymbolStrategy(symbol)) {
    case "exceed-bbands":
      return {
        ...base,
        id: `exceed-bbands-${symbol}`,
        sourceLabel: "EXCEED · BBANDS",
        signalType: "breakout",
        description: exceedBollingerDescription(hit.side),
      };
    case "macd-cross":
      return {
        ...base,
        id: `macd-cross-${symbol}`,
        sourceLabel: "CROSS · MACD",
        signalType: "momentum",
        description: macdCrossDescription(hit.side),
      };
    default:
      return {
        ...base,
        id: `sma-cross-${symbol}`,
        sourceLabel: `CROSS · SMA(${SMA_CROSS_PERIOD})`,
        signalType: "momentum",
        description: crossDescription(hit.side),
      };
  }
}

export function useScreenerSignals() {
  const [signals, setSignals] = useState<ScreenerSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const rows = await Promise.all(
          WATCHLIST_SYMBOLS.map(async (item) => {
            const candles = await fetchMiniChartCandles(item.id, HISTORY_LIMIT);
            const hit = findLastScreenerStrategySignal(candles, item.id);

            if (!hit) {
              return null;
            }

            return buildScreenerSignal(item.id, item.pair, hit);
          }),
        );

        if (cancelled) {
          return;
        }

        setSignals(
          rows
            .filter((entry): entry is ScreenerSignal => entry !== null)
            .sort((left, right) => right.timestamp - left.timestamp),
        );
        setLoading(false);
      } catch (nextError) {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : `Failed to load ${SCREENER_INTERVAL_LABEL} screener signals`,
          );
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { signals, loading, error };
}
