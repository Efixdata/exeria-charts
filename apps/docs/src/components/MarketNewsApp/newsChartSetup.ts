import type { Candle, ChartInstance, NewsFeedRecord } from "@efixdata/exeria-chart";
import { applyInstrumentLineStyle } from "../ForexOpportunityApp/forexInstrumentLineStyle";
import { findForexTimeframe } from "../ForexOpportunityApp/forexInstruments";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import { scrollChartToEnd } from "../ForexOpportunityApp/chartBarPosition";
import { getStaticNewsFeedBundle } from "../ForexOpportunityApp/newsFeedLoader";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import type { ThemeVariant } from "../themeCreator/core";
import { MARKET_NEWS_TIMEFRAME_ID, type MarketNewsPeriodId } from "./constants";
import { sliceCandlesByPeriod } from "./forexCandleUtils";
import { scheduleNewsChartRelayout } from "./marketNewsChartLayout";
import type { MarketNewsChartTheme } from "./marketNewsTheme";

async function getNewsFeedApi() {
  return import("@efixdata/exeria-chart");
}

function resolveNewsFeedRecords(
  instrument: string,
  records: NewsFeedRecord[],
): NewsFeedRecord[] {
  const bundle = getStaticNewsFeedBundle(instrument);
  if (!bundle) {
    return [];
  }

  const allowedIds = new Set(bundle.events.map((event) => event.id));
  return records.filter(
    (record) => record.instrument === instrument && allowedIds.has(record.id),
  );
}

function hasNewsFeedIndicator(chart: ChartInstance): boolean {
  return (
    chart.getChartIndicatorSettings?.().some((entry) => entry.key === "NEWSFEED") ?? false
  );
}

function newsMarkerColors(variant: ThemeVariant) {
  if (variant === "dark") {
    return {
      buy: "#4ade80",
      sell: "#f87171",
      neutral: "#93c5fd",
      size: 9,
    };
  }

  return {
    buy: "#16a34a",
    sell: "#dc2626",
    neutral: "#2563eb",
    size: 7,
  };
}

function buildNewsFeedIndicatorProto(
  chart: ChartInstance,
  variant: ThemeVariant,
): ReturnType<ChartInstance["getScripts"]>["NEWSFEED"] | null {
  const template = chart.getScripts().NEWSFEED;
  if (!template) {
    return null;
  }

  const markers = newsMarkerColors(variant);
  const proto = structuredClone(template);
  if (proto.inputs?.MARKER_SIZE) {
    proto.inputs.MARKER_SIZE.value = markers.size;
  }
  if (proto.inputs?.MARKER_SHAPE) {
    proto.inputs.MARKER_SHAPE.value = "Circle";
  }
  const plotters = proto.plotters?.map((plotter: Record<string, unknown>) => ({
    ...plotter,
    buyColor: markers.buy,
    sellColor: markers.sell,
    neutralColor: markers.neutral,
    markerShape: "Circle",
    width: markers.size,
    renderLegend: false,
  }));
  if (plotters) {
    proto.plotters = plotters;
  }

  return proto;
}

export async function ensureMarketNewsFeedIndicator(
  chart: ChartInstance,
  variant: ThemeVariant,
): Promise<void> {
  const proto = buildNewsFeedIndicatorProto(chart, variant);
  if (!proto) {
    return;
  }

  const existing = chart.getChartIndicatorSettings?.().find((entry) => entry.key === "NEWSFEED");
  if (existing?.scriptId != null) {
    chart.updateIndicator(existing.scriptId, proto);
    await chart.recalculateScripts?.({ rerender: false });
    return;
  }

  await chart.addScript("NEWSFEED", proto);
}

export async function syncMarketNewsFeed(
  chart: ChartInstance,
  records: NewsFeedRecord[],
  candles: Candle[],
  instrument: string,
): Promise<void> {
  if (!hasNewsFeedIndicator(chart)) {
    return;
  }

  const { clearInstrumentNewsFeed, setInstrumentNewsFeed } = await getNewsFeedApi();

  clearInstrumentNewsFeed();

  const scopedRecords = resolveNewsFeedRecords(instrument, records);
  if (scopedRecords.length > 0 && candles.length > 0) {
    setInstrumentNewsFeed(scopedRecords, candles);
  }

  await chart.recalculateScripts?.({ rerender: true });

  const settings = chart.getChartIndicatorSettings?.() ?? [];
  for (const entry of settings) {
    if (entry.key === "NEWSFEED" && entry.scriptId != null) {
      chart.setChartIndicatorVisibility(entry.scriptId, true);
    }
  }
}

type ChartRuntime = ChartInstance & {
  model: {
    mainSeries: string;
    panels: Array<{
      main?: boolean;
      hGrid?: boolean;
      vGrid?: boolean;
      basis?: number;
      _visible?: boolean;
      objects: Array<{ hidden?: boolean; type?: string }>;
    }>;
  };
};

function applyNewsChartChrome(chart: ChartInstance): void {
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

  chart.setValueAxisMode("lin");
  chart.setAutoScale(true);
}

function applyNewsLineGradient(chart: ChartInstance, lineColor: string, emphasized = true): void {
  const runtime = chart as ChartRuntime;
  const appearance = chart.getChartAppearanceSettings();
  const fillOpacity = emphasized ? 0.42 : 0.28;

  chart.applyChartAppearanceSettings({
    ...appearance,
    backgroundColor: appearance.backgroundColor ?? "#ffffff",
    chartLineColor: lineColor,
    chartFillGradientColor: lineColor,
    chartLineFillVisible: true,
    chartLineFillMode: "gradient",
    chartFillGradientOpacity: fillOpacity,
    lastPriceLineVisible: true,
    lastPriceLabelVisible: true,
  });

  applyInstrumentLineStyle(chart, runtime.model.mainSeries, {
    lineColor,
    lineFillMode: "gradient",
    fillOpacity,
  });
}

export async function setupNewsChart(
  chart: ChartInstance,
  records: NewsFeedRecord[],
  chartTheme: MarketNewsChartTheme,
  periodId: MarketNewsPeriodId = "1m",
): Promise<Candle[]> {
  const timeframeId = MARKET_NEWS_TIMEFRAME_ID;
  const tf = findForexTimeframe(timeframeId);
  const chartInterval = (await import("@efixdata/exeria-chart")).intervalFromSymbol(tf.interval);
  const raw = await loadStaticForexCandles("EUR/USD", timeframeId);
  const candles = sliceCandlesByPeriod(raw, periodId);

  await chart.setMainSeriesData(candles, chartInterval, false);
  chart.setMainDrawMode("Line");
  applyNewsChartChrome(chart);
  applyNewsLineGradient(chart, chartTheme.newsLineColor, chartTheme.variant === "light");

  await ensureMarketNewsFeedIndicator(chart, chartTheme.variant);
  await syncMarketNewsFeed(chart, records, candles, "EUR/USD");

  // NEWSFEED recalculate can reset line fill — re-apply gradient after sync.
  applyNewsLineGradient(chart, chartTheme.newsLineColor, chartTheme.variant === "light");

  ensureChartPointerMode(chart);
  scrollChartToEnd(chart);
  chart.render();

  return candles;
}

export async function refreshNewsChartTheme(
  chart: ChartInstance,
  records: NewsFeedRecord[],
  candles: Candle[],
  chartTheme: MarketNewsChartTheme,
): Promise<void> {
  applyNewsChartChrome(chart);
  applyNewsLineGradient(chart, chartTheme.newsLineColor, chartTheme.variant === "light");

  await ensureMarketNewsFeedIndicator(chart, chartTheme.variant);
  await syncMarketNewsFeed(chart, records, candles, "EUR/USD");

  applyNewsLineGradient(chart, chartTheme.newsLineColor, chartTheme.variant === "light");
  scheduleNewsChartRelayout(chart);
}
