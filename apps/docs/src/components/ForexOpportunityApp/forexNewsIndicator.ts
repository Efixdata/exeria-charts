import type { Candle, ChartInstance, NewsFeedRecord } from "@efixdata/exeria-chart";
import { getStaticNewsFeedBundle } from "./newsFeedLoader";

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

export function hideForexStrategyMarkers(chart: ChartInstance): void {
  const strategies = chart.getChartStrategySettings?.() ?? [];

  for (const strategy of strategies) {
    if (strategy.key === "CROSS" || strategy.key === "EXCEED") {
      chart.setChartStrategyVisibility(strategy.scriptId, false);
    }
  }
}

function hasNewsFeedIndicator(chart: ChartInstance): boolean {
  return (
    chart.getChartIndicatorSettings?.().some((entry) => entry.key === "NEWSFEED") ?? false
  );
}

export function resetForexNewsFeedState(): void {
  void getNewsFeedApi().then(({ clearInstrumentNewsFeed }) => clearInstrumentNewsFeed());
}

export async function applyForexNewsFeedIndicator(chart: ChartInstance): Promise<void> {
  if (hasNewsFeedIndicator(chart)) {
    return;
  }

  const template = chart.getScripts().NEWSFEED;
  if (!template) {
    return;
  }

  const proto = structuredClone(template);
    // @ts-ignore
    // @ts-ignore
  proto.inputs.MARKER_SIZE.value = 6;
    // @ts-ignore
    // @ts-ignore
  proto.inputs.MARKER_SHAPE.value = "Circle";
    // @ts-ignore
  proto.plotters = proto.plotters?.map((plotter) => ({
    ...plotter,
    buyColor: "#22c55e",
    sellColor: "#ef4444",
    neutralColor: "#3b82f6",
    markerShape: "Circle",
    width: 6,
    renderLegend: true,
  }));

  await chart.addScript("NEWSFEED", proto);
}

export async function syncForexNewsFeed(
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
}
