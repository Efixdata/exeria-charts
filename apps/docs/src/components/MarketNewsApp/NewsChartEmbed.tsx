"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "@docusaurus/Link";
import type { Candle, ChartInstance, NewsFeedRecord } from "@exeria/charts";
import { applyChartSettingsPreset } from "../themeCreator/applyChartSettingsPreset";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme } from "../themeCreator/core";
import {
  mapNewsFeedToChartEvents,
  SENTIMENT_COLORS,
  type ChartNewsEvent,
} from "../ForexOpportunityApp/chartNews";
import { findForexPair } from "../ForexOpportunityApp/forexInstruments";
import { loadInstrumentNewsFeed } from "../ForexOpportunityApp/newsFeedLoader";
import { clearNewsChartLayer } from "../ForexOpportunityApp/newsChartLayer";
import { focusMarketNewsOnChart } from "./marketNewsChartFocus";
import MarketNewsChartCallout from "./MarketNewsChartCallout";
import { useMarketNewsLayoutTheme } from "./MarketNewsThemeContext";
import { refreshNewsChartTheme, setupNewsChart } from "./newsChartSetup";
import {
  observeChartContainer,
  scheduleNewsChartRelayout,
  waitForChartContainerReady,
} from "./marketNewsChartLayout";
import { getMarketNewsChartTheme } from "./marketNewsTheme";
import styles from "./marketNewsApp.module.css";

export default function NewsChartEmbed() {
  const layoutTheme = useMarketNewsLayoutTheme();
  const chartTheme = useMemo(() => getMarketNewsChartTheme(layoutTheme), [layoutTheme]);
  const chartThemeRef = useRef(chartTheme);
  chartThemeRef.current = chartTheme;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const newsEventsRef = useRef<ChartNewsEvent[]>([]);
  const candlesRef = useRef<Candle[]>([]);
  const recordsRef = useRef<NewsFeedRecord[]>([]);
  const selectedNewsIdRef = useRef<string | null>(null);
  const themeAppliedRef = useRef(false);

  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [records, setRecords] = useState<NewsFeedRecord[]>([]);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<{ clientX: number; clientY: number } | null>(
    null,
  );
  const [calloutLayoutToken, setCalloutLayoutToken] = useState(0);

  const runtimeTheme = useMemo(() => {
    const preset = themePresets.find((entry) => entry.id === chartTheme.presetId) ?? themePresets[0]!;
    return buildChartTheme(preset.chart);
  }, [chartTheme.presetId]);

  const newsEvents = useMemo(
    () => mapNewsFeedToChartEvents(records, candles, "EUR/USD"),
    [candles, records],
  );

  newsEventsRef.current = newsEvents;
  candlesRef.current = candles;
  recordsRef.current = records;
  selectedNewsIdRef.current = selectedNewsId;

  const selectedNews = useMemo(
    () => newsEvents.find((event) => event.id === selectedNewsId) ?? null,
    [newsEvents, selectedNewsId],
  );

  const openNews = useCallback(
    (
      newsId: string,
      anchor: { clientX: number; clientY: number } | null = null,
    ) => {
      const event = newsEventsRef.current.find((item) => item.id === newsId);
      if (!event) {
        return;
      }

      setSelectedNewsId(newsId);
      setCalloutAnchor(anchor);
      setCalloutLayoutToken((token) => token + 1);

      if (chartRef.current) {
        focusMarketNewsOnChart(chartRef.current, event.barIndex);
      }
    },
    [],
  );

  const handleSelectNews = useCallback(
    (newsId: string) => {
      openNews(newsId, null);
    },
    [openNews],
  );

  useEffect(() => {
    if (!chart?.subscribe) {
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
  }, [chart, openNews]);

  useEffect(() => {
    let disposed = false;
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const mount = async () => {
      setLoading(true);
      setError(null);

      try {
        await waitForChartContainerReady(container);
        if (disposed) {
          return;
        }

        const feedRecords = await loadInstrumentNewsFeed("EUR/USD", { limit: 12 });
        if (disposed) {
          return;
        }

        setRecords(feedRecords);
        recordsRef.current = feedRecords;

        const chartModule = await import("@exeria/charts");
        if (disposed) {
          return;
        }

        const theme = chartThemeRef.current;
        const preset = themePresets.find((entry) => entry.id === theme.presetId) ?? themePresets[0]!;
        const initialRuntimeTheme = buildChartTheme(preset.chart);

        const instance = chartModule.createChart({
          container,
          instrument: {
            id: "EUR/USD",
            symbol: "EUR/USD",
            name: findForexPair("EUR/USD").label,
            description: findForexPair("EUR/USD").label,
            precision: findForexPair("EUR/USD").priceDecimals,
            chart: "ohlc",
            tradable: false,
            keyWords: ["EUR/USD"],
            related: [],
          },
          theme: initialRuntimeTheme,
          themeVariant: theme.variant,
        });

        chartRef.current = instance;
        instance.init();
        applyChartSettingsPreset(instance, theme.presetId);

        const loadedCandles = await setupNewsChart(instance, feedRecords, theme, "1m");
        if (disposed) {
          instance.destroy();
          return;
        }

        setCandles(loadedCandles);
        candlesRef.current = loadedCandles;
        setChart(instance);

        const defaultNews = mapNewsFeedToChartEvents(feedRecords, loadedCandles, "EUR/USD").at(-2);
        if (defaultNews) {
          setSelectedNewsId(defaultNews.id);
          selectedNewsIdRef.current = defaultNews.id;
          setCalloutLayoutToken((token) => token + 1);
          focusMarketNewsOnChart(instance, defaultNews.barIndex);
        }

        scheduleNewsChartRelayout(instance);
        setChartReady(true);
        setLoading(false);
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load chart");
          setLoading(false);
        }
      }
    };

    void mount();

    return () => {
      disposed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
      setChart(null);
      setChartReady(false);
      themeAppliedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const chart = chartRef.current;
    const container = containerRef.current;
    if (!chartReady || !chart || !container) {
      return undefined;
    }

    return observeChartContainer(container, chartRef, scheduleNewsChartRelayout);
  }, [chartReady]);

  useEffect(() => {
    const instance = chartRef.current;
    if (!chartReady || !instance) {
      return;
    }

    if (!themeAppliedRef.current) {
      themeAppliedRef.current = true;
      return;
    }

    let disposed = false;

    const refreshTheme = async () => {
      applyChartSettingsPreset(instance, chartTheme.presetId);
      instance.applyChartTheme(runtimeTheme, chartTheme.variant);

      await refreshNewsChartTheme(
        instance,
        recordsRef.current,
        candlesRef.current,
        chartTheme,
      );

      if (disposed) {
        return;
      }

      const activeNewsId = selectedNewsIdRef.current;
      if (activeNewsId) {
        const event = mapNewsFeedToChartEvents(
          recordsRef.current,
          candlesRef.current,
          "EUR/USD",
        ).find((item) => item.id === activeNewsId);

        if (event) {
          focusMarketNewsOnChart(instance, event.barIndex);
          setCalloutLayoutToken((token) => token + 1);
        }
      }
    };

    void refreshTheme();

    return () => {
      disposed = true;
    };
  }, [chartReady, chartTheme, runtimeTheme]);

  const handleCloseCallout = () => {
    setSelectedNewsId(null);
    selectedNewsIdRef.current = null;
    setCalloutAnchor(null);
    if (chartRef.current) {
      clearNewsChartLayer(chartRef.current);
    }
  };

  return (
    <figure className={styles.chartFigure}>
      <div className={styles.chartToolbar}>
        <span className={styles.chartToolbarLabel}>EUR/USD · news markers</span>
        <Link className={styles.chartCodeLink} to="/starters/market-news#market-news-developer">
          View embed code
        </Link>
      </div>

      <div ref={stackRef} className={styles.chartStack}>
        <div className={styles.chartFrame}>
          {loading ? <div className={styles.chartState}>Loading chart…</div> : null}
          {error ? <div className={styles.chartStateError}>{error}</div> : null}
          <div ref={containerRef} className={styles.chartCanvas} />
        </div>

        {chart && selectedNews ? (
          <MarketNewsChartCallout
            chart={chart}
            news={selectedNews}
            containerRef={containerRef}
            stackRef={stackRef}
            anchor={calloutAnchor}
            layoutToken={calloutLayoutToken}
            onClose={handleCloseCallout}
          />
        ) : null}
      </div>

      <div className={styles.newsPicker} role="list" aria-label="News events on chart">
        {newsEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            role="listitem"
            className={[
              styles.newsChip,
              event.id === selectedNewsId ? styles.newsChipActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--news-chip-color": SENTIMENT_COLORS[event.sentiment] } as CSSProperties}
            onClick={() => handleSelectNews(event.id)}
          >
            <span className={styles.newsChipSource}>{event.source}</span>
            <span className={styles.newsChipTitle}>{event.headline}</span>
          </button>
        ))}
      </div>

      <figcaption className={styles.chartCaption}>
        <p>
          Fig. 2 — Headlines from the bundled EUR/USD news feed. Click a marker or chip to open the
          callout. Wire your CMS with <code>setInstrumentNewsFeed()</code>.
        </p>
      </figcaption>
    </figure>
  );
}
