import type { Candle, NewsFeedImpactMeasure, NewsFeedRecord } from "@exeria/charts";
import { resolveNewsBarIndex } from "@exeria/charts";
import { PIP_SIZE } from "./constants";
import { getStaticNewsFeedBundle } from "./newsFeedLoader";

export type NewsSentiment = "positive" | "negative" | "neutral";

export type ChartNewsEvent = {
  id: string;
  stamp: number;
  barIndex: number;
  sentiment: NewsSentiment;
  headline: string;
  source: string;
  body: string;
  instrument: string;
  impact: {
    pips15m: number;
    pips1h: number;
    peakBarIndex: number;
    direction: "up" | "down" | "flat";
  };
};

export const SENTIMENT_COLORS: Record<NewsSentiment, string> = {
  positive: "#22c55e",
  negative: "#ef4444",
  neutral: "#3b82f6",
};

function recordImpactToChart(
  impact: NewsFeedImpactMeasure[] | undefined,
  barIndex: number,
): ChartNewsEvent["impact"] | null {
  if (!impact?.length) {
    return null;
  }

  const pips15m = impact.find((entry) => entry.horizon === "15m");
  const pips1h = impact.find((entry) => entry.horizon === "1h");
  const direction = pips15m?.direction ?? pips1h?.direction ?? "flat";

  return {
    pips15m: pips15m?.pips ?? 0,
    pips1h: pips1h?.pips ?? 0,
    peakBarIndex: barIndex,
    direction,
  };
}

export function mapNewsFeedToChartEvents(
  records: NewsFeedRecord[],
  candles: Candle[],
  instrument: string,
): ChartNewsEvent[] {
  if (!candles.length) {
    return [];
  }

  const bundle = getStaticNewsFeedBundle(instrument);
  const allowedIds = bundle
    ? new Set(bundle.events.map((event) => event.id))
    : null;

  return records
    .filter(
      (record) =>
        record.instrument === instrument &&
        (allowedIds == null || allowedIds.has(record.id)),
    )
    .map((record) => {
      const barIndex = resolveNewsBarIndex(record.releasedAt, candles);
      if (barIndex === null) {
        return null;
      }

      return {
        id: record.id,
        stamp: record.releasedAt,
        barIndex,
        sentiment: record.sentiment,
        headline: record.title,
        source: record.source.name,
        body: record.summary,
        instrument: record.instrument,
        impact:
          recordImpactToChart(record.impact, barIndex) ?? computeNewsImpact(candles, barIndex),
      };
    })
    .filter((event): event is ChartNewsEvent => event !== null);
}

function priceToPips(delta: number): number {
  return Math.round((delta / PIP_SIZE) * 10) / 10;
}

export function computeNewsImpact(candles: Candle[], barIndex: number): ChartNewsEvent["impact"] {
  const release = candles[barIndex];
  if (!release) {
    return { pips15m: 0, pips1h: 0, peakBarIndex: barIndex, direction: "flat" };
  }

  const bar15m = candles[Math.min(barIndex + 1, candles.length - 1)];
  const bar1h = candles[Math.min(barIndex + 4, candles.length - 1)];

  const pips15m = bar15m ? priceToPips(bar15m.c - release.c) : 0;
  const pips1h = bar1h ? priceToPips(bar1h.c - release.c) : 0;

  let peakBarIndex = barIndex;
  let peakMove = 0;
  const windowEnd = Math.min(barIndex + 8, candles.length - 1);

  for (let index = barIndex + 1; index <= windowEnd; index += 1) {
    const move = candles[index]!.c - release.c;
    if (Math.abs(move) > Math.abs(peakMove)) {
      peakMove = move;
      peakBarIndex = index;
    }
  }

  const direction: ChartNewsEvent["impact"]["direction"] =
    Math.abs(peakMove) < PIP_SIZE * 0.5 ? "flat" : peakMove > 0 ? "up" : "down";

  return { pips15m, pips1h, peakBarIndex, direction };
}

export function buildForexNewsEvents(candles: Candle[], instrument = "EUR/USD"): ChartNewsEvent[] {
  return mapNewsFeedToChartEvents([], candles, instrument);
}

export function formatPips(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} pips`;
}

export function formatNewsTime(stamp: number): string {
  return new Date(stamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
