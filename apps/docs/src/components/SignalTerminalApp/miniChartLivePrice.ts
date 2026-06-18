import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import { refreshMiniChartChrome } from "./miniChartChrome";
import { reapplyMiniChartMarker } from "./miniChartMarkerState";
import { followMiniChartLiveEdge } from "./miniChartSignalTagViewport";
import { isMiniChartViewportUserAdjusted } from "./miniChartViewportState";
import { alignHourDown, HOUR_MS } from "./signalMiniChartData";

type MainSeriesHost = ChartInstance & {
  model: {
    mainSeries?: string;
  };
  instrument?: {
    symbol?: string;
  };
};

function getChartSymbol(chart: ChartInstance): string | undefined {
  return (chart as MainSeriesHost).instrument?.symbol;
}

function getMainCandles(chart: ChartInstance): Candle[] | null {
  const host = chart as MainSeriesHost;
  const mainKey = host.model.mainSeries;

  if (mainKey) {
    const main = chart.getSeriesManager()[mainKey];
    if (Array.isArray(main?.data) && main.data.length > 0) {
      return main.data as Candle[];
    }
  }

  for (const series of Object.values(chart.getSeriesManager())) {
    if (
      Array.isArray(series.fields) &&
      series.fields.includes("c") &&
      series.fields.includes("o") &&
      Array.isArray(series.data) &&
      series.data.length > 0
    ) {
      return series.data as Candle[];
    }
  }

  return null;
}

function patchLastCandle(last: Candle, marketPrice: number): void {
  last.c = marketPrice;
  if (marketPrice > last.h) {
    last.h = marketPrice;
  }
  if (marketPrice < last.l) {
    last.l = marketPrice;
  }
}

function appendLivePeriodTicks(
  chart: ChartInstance,
  candles: Candle[],
  marketPrice: number,
  tickStamp: number,
): boolean {
  const targetStamp = alignHourDown(tickStamp);
  let lastStamp = candles[candles.length - 1]?.stamp;

  if (lastStamp === undefined || targetStamp <= lastStamp) {
    return false;
  }

  let newCandleAdded = false;

  while (lastStamp !== undefined && lastStamp < targetStamp) {
    const nextStamp = lastStamp + HOUR_MS;
    if (chart.appendTick({ stamp: nextStamp, price: marketPrice }, false)) {
      newCandleAdded = true;
    }
    lastStamp = nextStamp;
  }

  return newCandleAdded;
}

/**
 * Update the last bar for the current hour, or append a new bar and scroll when the hour rolls.
 */
export function updateMiniChartLivePrice(
  chart: ChartInstance,
  symbol: string,
  marketPrice: number,
  tickStamp = Date.now(),
): void {
  if (getChartSymbol(chart) !== symbol) {
    return;
  }

  const candles = getMainCandles(chart);
  const last = candles?.[candles.length - 1];

  if (!last) {
    return;
  }

  const currentStamp = alignHourDown(tickStamp);
  let newCandleAdded = false;

  if (currentStamp > last.stamp) {
    newCandleAdded = appendLivePeriodTicks(chart, candles, marketPrice, tickStamp);
  } else {
    patchLastCandle(last, marketPrice);
  }

  if (newCandleAdded && !isMiniChartViewportUserAdjusted(chart)) {
    try {
      chart.recalculateScripts({ shortSynchronization: true });
    } catch {
      // ignore script sync errors on live tick
    }
    followMiniChartLiveEdge(chart);
  }

  refreshMiniChartChrome(chart);
  reapplyMiniChartMarker(chart);
  chart.render();
}
