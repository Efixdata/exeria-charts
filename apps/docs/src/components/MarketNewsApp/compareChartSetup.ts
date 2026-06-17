import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import { removeChartOverlay } from "../CryptoTerminalApp/chartCompareOverlay";
import { scrollChartToEnd, fitChartSeriesToPlotWidth } from "../ForexOpportunityApp/chartBarPosition";
import { applyInstrumentLineStyle } from "../ForexOpportunityApp/forexInstrumentLineStyle";
import { findForexPair, findForexTimeframe } from "../ForexOpportunityApp/forexInstruments";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import {
  COMPARE_CHART_PERIOD_BARS,
  COMPARE_OVERLAY_SYMBOL,
  COMPARE_PRIMARY_SYMBOL,
  MARKET_NEWS_TIMEFRAME_ID,
  type MarketNewsPeriodId,
} from "./constants";
import { indexCandlesToBase } from "./forexCandleUtils";
import type { MarketNewsChartTheme } from "./marketNewsTheme";

type ChartRuntime = ChartInstance & {
  model: {
    mainSeries: string;
    panels: Array<{
      main?: boolean;
      hGrid?: boolean;
      vGrid?: boolean;
      basis?: number;
      _visible?: boolean;
      objects: Array<{ dataLink?: string; color?: string; hidden?: boolean; type?: string }>;
    }>;
  };
};

function applyEditorialChrome(chart: ChartInstance): void {
  const runtime = chart as ChartRuntime;
  const volume = chart.getChartVolumeSettings();

  if (volume.available) {
    chart.applyChartVolumeSettings({ ...volume, visible: false });
    if (volume.scriptId != null) {
      chart.setChartIndicatorVisibility(volume.scriptId, false);
    }
  }

  for (const panel of runtime.model.panels) {
    if (!panel.main) {
      panel.basis = 0;
      panel._visible = false;
      for (const object of panel.objects) {
        object.hidden = true;
      }
      continue;
    }

    panel.hGrid = true;
    panel.vGrid = false;
  }

  chart.setValueAxisMode("%");
  chart.setAutoScale(true);
}

function styleMainSeries(runtime: ChartRuntime, seriesId: string, color: string): void {
  const mainPanel = runtime.model.panels.find((panel) => panel.main) ?? runtime.model.panels[0];
  if (!mainPanel) {
    return;
  }

  for (const object of mainPanel.objects) {
    if (object.dataLink === seriesId) {
      object.color = color;
      object.strokeStyle = color;
    }
  }
}

async function applyStaticForexOverlay(
  chart: ChartInstance,
  symbol: string,
  candles: Candle[],
  interval: string,
  lineColor: string,
): Promise<void> {
  const chartModule = await import("@efixdata/exeria-chart");
  const chartInterval = chartModule.intervalFromSymbol(interval);
  const pair = findForexPair(symbol);
  const seriesId = `overlay-${symbol}`;
  const runtime = chart as ChartRuntime;
  const mainPanel = runtime.model.panels.find((panel) => panel.main) ?? runtime.model.panels[0];

  const overlayRuntime = chart as ChartInstance & {
    model: {
      instrumentsSeries: Array<{
        seriesId: string;
        title: string;
        labels: string[];
        fields: string[];
        instrument: Record<string, unknown>;
      }>;
    };
    fusion: { fullSynchronization(): void };
  };

  if (!overlayRuntime.model.instrumentsSeries.some((entry) => entry.seriesId === seriesId)) {
    overlayRuntime.model.instrumentsSeries.push({
      seriesId,
      title: pair.label,
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument: { symbol, description: pair.label },
    });

    if (mainPanel && !mainPanel.objects.some((object) => object.dataLink === seriesId)) {
      mainPanel.objects.push({
        id: seriesId,
        type: "SeriesObject",
        dataLink: seriesId,
        renderAs: "Line",
        color: lineColor,
        stroke: [1.5],
        dash: [5, 4],
        width: 1.5,
        priceTag: false,
        priceLine: false,
        openDataField: "o",
        highDataField: "h",
        lowDataField: "l",
        closeDataField: "c",
        dataField: "c",
        strokeStyle: lineColor,
        hidden: false,
      });
    }
  }

  const seriesManager = chart.getSeriesManager();
  seriesManager[seriesId] = {
    seriesId,
    title: pair.label,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument: { symbol, description: pair.label },
    interval: chartInterval,
    data: candles,
  };

  overlayRuntime.fusion.fullSynchronization();
  chart.setInstrumentDrawMode("Line", seriesId);
  chart.applyChartInstrumentSettings(seriesId, {
    lineColor,
    lineDash: [5, 4],
  });
  applyInstrumentLineStyle(chart, seriesId, {
    lineColor,
    lineFillMode: "gradient",
    fillOpacity: 0.16,
  });
}

export async function setupCompareChart(
  chart: ChartInstance,
  periodId: MarketNewsPeriodId,
  chartTheme: MarketNewsChartTheme,
): Promise<{ primary: Candle[]; overlay: Candle[] }> {
  const timeframeId = MARKET_NEWS_TIMEFRAME_ID;
  const tf = findForexTimeframe(timeframeId);
  const chartInterval = (await import("@efixdata/exeria-chart")).intervalFromSymbol(tf.interval);

  const [primaryRaw, overlayRaw] = await Promise.all([
    loadStaticForexCandles(COMPARE_PRIMARY_SYMBOL, timeframeId),
    loadStaticForexCandles(COMPARE_OVERLAY_SYMBOL, timeframeId),
  ]);

  const barCount = COMPARE_CHART_PERIOD_BARS[periodId];
  const primary = indexCandlesToBase(primaryRaw.slice(-Math.min(barCount, primaryRaw.length)));
  const overlay = indexCandlesToBase(overlayRaw.slice(-Math.min(barCount, overlayRaw.length)));

  removeChartOverlay(chart, COMPARE_OVERLAY_SYMBOL);

  await chart.setMainSeriesData(primary, chartInterval);
  chart.setMainDrawMode("Line");

  const runtime = chart as ChartRuntime;
  styleMainSeries(runtime, runtime.model.mainSeries, chartTheme.comparePrimary);
  applyInstrumentLineStyle(chart, runtime.model.mainSeries, {
    lineColor: chartTheme.comparePrimary,
    lineFillMode: "gradient",
    fillOpacity: 0.2,
  });

  await applyStaticForexOverlay(
    chart,
    COMPARE_OVERLAY_SYMBOL,
    overlay,
    tf.interval,
    chartTheme.compareOverlay,
  );

  applyEditorialChrome(chart);

  const snapViewport = () => {
    if (!fitChartSeriesToPlotWidth(chart)) {
      scrollChartToEnd(chart);
    } else {
      chart.render();
    }
  };

  snapViewport();
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(snapViewport);
  }

  return { primary, overlay };
}
