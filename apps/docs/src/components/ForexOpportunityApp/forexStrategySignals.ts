import type { Candle, ChartInstance } from "@exeria/charts";
import { findLastExceedBollingerSignal } from "../SignalTerminalApp/exceedBollingerCore";
import { findLastMacdCrossSignal } from "../SignalTerminalApp/macdCrossCore";

export type StrategySignalHit = {
  barIndex: number;
  timestamp: number;
  price: number;
  side: "buy" | "sell";
  label: string;
};

export function findLastMacdCrossHit(candles: Candle[]): StrategySignalHit | null {
  const hit = findLastMacdCrossSignal(candles);
  if (!hit) {
    return null;
  }

  return {
    barIndex: hit.barIndex,
    timestamp: hit.timestamp,
    price: hit.signalPrice,
    side: hit.side,
    label: "MACD cross",
  };
}

export function findLastExceedHit(candles: Candle[]): StrategySignalHit | null {
  const hit = findLastExceedBollingerSignal(candles);
  if (!hit) {
    return null;
  }

  return {
    barIndex: hit.barIndex,
    timestamp: hit.timestamp,
    price: hit.signalPrice,
    side: hit.side,
    label: "Band exceed",
  };
}

/** Last Buy/Sell marker from a CROSS strategy series already on the chart. */
export function findLastChartCrossMarker(chart: ChartInstance): StrategySignalHit | null {
  const host = chart as ChartInstance & {
    model?: { mainSeries?: string };
  };
  const seriesManager = chart.getSeriesManager();
  const mainKey = host.model?.mainSeries;

  for (const [seriesId, series] of Object.entries(seriesManager)) {
    if (!seriesId.includes("CROSS") && !String(series.title ?? "").includes("Cross")) {
      continue;
    }

    const data = series.data as Array<Record<string, unknown>>;
    if (!Array.isArray(data) || data.length === 0) {
      continue;
    }

    for (let index = data.length - 1; index >= 0; index -= 1) {
      const point = data[index];
      const crossValue = point?.CrossValue ?? point?.crossValue;
      if (crossValue === "Buy" || crossValue === 1) {
        const candle = (mainKey ? seriesManager[mainKey]?.data : data) as Candle[] | undefined;
        const bar = candle?.[index];
        if (!bar) {
          continue;
        }
        return {
          barIndex: index,
          timestamp: bar.stamp,
          price: bar.c,
          side: "buy",
          label: "CROSS Buy",
        };
      }
      if (crossValue === "Sell" || crossValue === -1) {
        const candle = (mainKey ? seriesManager[mainKey]?.data : data) as Candle[] | undefined;
        const bar = candle?.[index];
        if (!bar) {
          continue;
        }
        return {
          barIndex: index,
          timestamp: bar.stamp,
          price: bar.c,
          side: "sell",
          label: "CROSS Sell",
        };
      }
    }
  }

  return findLastMacdCrossHit(
    (mainKey ? seriesManager[mainKey]?.data : []) as Candle[],
  );
}
