"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Candle, ChartInstance, NewsFeedRecord } from "@efixdata/exeria-chart";
import {
  mapNewsFeedToChartEvents,
  type ChartNewsEvent,
} from "../ForexOpportunityApp/chartNews";
import { loadInstrumentNewsFeed } from "../ForexOpportunityApp/newsFeedLoader";
import MarketNewsChartCallout from "../MarketNewsApp/MarketNewsChartCallout";
import { docChartEmbedStyles } from "../DocChartEmbed";

type PlaygroundNewsOverlayProps = {
  chart: ChartInstance | null;
  stackRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  sceneVersion: number;
};

function resolveChartCanvas(stack: HTMLDivElement | null): HTMLDivElement | null {
  if (!stack) {
    return null;
  }

  return stack.querySelector(`.${docChartEmbedStyles.canvas}`) as HTMLDivElement | null;
}

export default function PlaygroundNewsOverlay({
  chart,
  stackRef,
  enabled,
  sceneVersion,
}: PlaygroundNewsOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const newsEventsRef = useRef<ChartNewsEvent[]>([]);
  const [records, setRecords] = useState<NewsFeedRecord[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<{ clientX: number; clientY: number } | null>(
    null,
  );
  const [calloutLayoutToken, setCalloutLayoutToken] = useState(0);

  useEffect(() => {
    containerRef.current = resolveChartCanvas(stackRef.current);
  }, [chart, enabled, sceneVersion, stackRef]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let disposed = false;

    void loadInstrumentNewsFeed("EUR/USD", { limit: 12 }).then((feedRecords) => {
      if (!disposed) {
        setRecords(feedRecords);
      }
    });

    return () => {
      disposed = true;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !chart) {
      setSelectedNewsId(null);
      setCalloutAnchor(null);
      setCandles([]);
      return;
    }

    const series = chart.getSeriesManager();
    const mainKey = chart.getMainSeriesId?.() ?? Object.keys(series)[0];
    const mainCandles = mainKey ? (series[mainKey]?.data as Candle[] | undefined) : undefined;
    setCandles(mainCandles ?? []);
    setSelectedNewsId(null);
    setCalloutAnchor(null);
  }, [chart, enabled, sceneVersion]);

  const newsEvents = useMemo(() => {
    if (!Array.isArray(candles) || candles.length === 0 || records.length === 0) {
      return [];
    }

    return mapNewsFeedToChartEvents(records, candles, "EUR/USD");
  }, [candles, records]);

  newsEventsRef.current = newsEvents;

  const selectedNews = useMemo(
    () => newsEvents.find((event) => event.id === selectedNewsId) ?? null,
    [newsEvents, selectedNewsId],
  );

  const openNews = useCallback(
    (newsId: string, anchor: { clientX: number; clientY: number } | null = null) => {
      const event = newsEventsRef.current.find((item) => item.id === newsId);
      if (!event) {
        return;
      }

      setSelectedNewsId(newsId);
      setCalloutAnchor(anchor);
      setCalloutLayoutToken((token) => token + 1);
    },
    [],
  );

  useEffect(() => {
    if (!enabled || !chart?.subscribe) {
      return undefined;
    }

    const subscription = chart.subscribe("NEWS_FEED_MARKER_CLICK", (data) => {
      const payload = data as {
        barIndex?: number;
        eventId?: string;
        clientX?: number;
        clientY?: number;
      };

      let hit: ChartNewsEvent | undefined;
      if (typeof payload.eventId === "string") {
        hit = newsEventsRef.current.find((item) => item.id === payload.eventId);
      }
      if (!hit && typeof payload.barIndex === "number") {
        hit = newsEventsRef.current.find((item) => item.barIndex === payload.barIndex);
      }
      if (!hit) {
        return;
      }

      const anchor =
        typeof payload.clientX === "number" && typeof payload.clientY === "number"
          ? { clientX: payload.clientX, clientY: payload.clientY }
          : null;

      openNews(hit.id, anchor);
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [chart, enabled, openNews]);

  if (!enabled || !chart || !selectedNews) {
    return null;
  }

  return (
    <MarketNewsChartCallout
      chart={chart}
      news={selectedNews}
      containerRef={containerRef}
      stackRef={stackRef}
      anchor={calloutAnchor}
      layoutToken={calloutLayoutToken}
      theme="dark"
      onClose={() => {
        setSelectedNewsId(null);
        setCalloutAnchor(null);
      }}
    />
  );
}
