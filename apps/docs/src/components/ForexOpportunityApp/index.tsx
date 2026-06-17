"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import type { ArbSignalRecord, Candle, ChartInstance, NewsFeedRecord } from "@efixdata/exeria-chart";
import { installBenignResizeObserverErrorSuppression } from "@site/src/utils/suppressBenignResizeObserverErrors";
import { TERMINAL_UI_FONT_VARS } from "../CryptoTerminalApp/terminalTypography";
import { applyArbSignalScene } from "./applyArbSignalScene";
import { syncForexNewsFeed } from "./forexNewsIndicator";
import { mapNewsFeedToChartEvents, type ChartNewsEvent } from "./chartNews";
import { loadInstrumentNewsFeed } from "./newsFeedLoader";
import { findArbSignalByNewsId } from "./arbSignalLoader";
import { OPPORTUNITY_FILTERS, type OpportunityFilter } from "./constants";
import type { ForexAppTheme } from "./constants";
import {
  FOREX_OPPORTUNITIES,
  filterOpportunities,
  getSignalSymbol,
  getSignalTimeframeId,
} from "./opportunityCatalog";
import type { ForexTimeframeId } from "./forexInstruments";
import ForexChartHost, { type ForexChartHostMeta } from "./ForexChartHost";
import type { ForexStaticDataAdapter } from "./forexStaticDataAdapter";
import NewsChartCallout from "./NewsChartCallout";
import OpportunityBrief from "./OpportunityBrief";
import OpportunityFeed from "./OpportunityFeed";
import MarketControls from "./MarketControls";
import WelcomeBanner from "./WelcomeBanner";
import GuidedTour, { TOUR_STEPS } from "./GuidedTour";
import CalendarStrip from "./CalendarStrip";
import { focusChartOnBar, scrollChartToEnd } from "./chartBarPosition";
import {
  useChartRerenderOnLayoutChange,
  useTerminalViewport,
} from "../CryptoTerminalApp/useTerminalViewport";
import styles from "./forexOpportunityApp.module.css";

const DEFAULT_SIGNAL = FOREX_OPPORTUNITIES[0]!;
const WELCOME_KEY = "fx-opportunity-radar-welcome-dismissed";
const TOUR_KEY = "fx-opportunity-radar-tour-done";

type MobilePanel = "feed" | "chart" | "brief";

export default function ForexOpportunityApp() {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartStackRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ForexStaticDataAdapter | null>(null);
  const applyingRef = useRef(false);
  const shouldFocusSceneRef = useRef(false);

  const [symbol, setSymbol] = useState(getSignalSymbol(DEFAULT_SIGNAL));
  const [timeframeId, setTimeframeId] = useState<ForexTimeframeId>(
    getSignalTimeframeId(DEFAULT_SIGNAL),
  );
  const [dataMode, setDataMode] = useState<"static">("static");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [filter, setFilter] = useState<OpportunityFilter>("all");
  const [layoutTheme, setLayoutTheme] = useState<ForexAppTheme>("dark");
  const [selectedId, setSelectedId] = useState(DEFAULT_SIGNAL.id);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const [calloutAnchor, setCalloutAnchor] = useState<{
    clientX: number;
    clientY: number;
  } | null>(null);
  const [calloutLayoutToken, setCalloutLayoutToken] = useState(0);
  const [newsFocusRequest, setNewsFocusRequest] = useState(0);
  const suppressScrollToEndRef = useRef(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [rawFeedRecords, setRawFeedRecords] = useState<NewsFeedRecord[]>([]);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");

  const { isMobile } = useTerminalViewport();
  useChartRerenderOnLayoutChange(chart, `${mobilePanel}-${isMobile}`);

  useEffect(() => {
    let cancelled = false;

    setRawFeedRecords([]);

    void loadInstrumentNewsFeed(symbol).then((records) => {
      if (!cancelled) {
        setRawFeedRecords(records);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const newsEvents = useMemo(
    () => mapNewsFeedToChartEvents(rawFeedRecords, candles, symbol),
    [rawFeedRecords, candles, symbol],
  );

  const filteredOpportunities = useMemo(
    () => filterOpportunities(FOREX_OPPORTUNITIES, filter),
    [filter],
  );

  const selectedSignal = useMemo(
    () => FOREX_OPPORTUNITIES.find((item) => item.id === selectedId) ?? null,
    [selectedId],
  );

  const linkedNews = useMemo(() => {
    if (selectedNewsId) {
      return newsEvents.find((item) => item.id === selectedNewsId) ?? null;
    }
    if (selectedSignal?.linkedNewsId) {
      return newsEvents.find((item) => item.id === selectedSignal.linkedNewsId) ?? null;
    }
    return null;
  }, [newsEvents, selectedNewsId, selectedSignal]);

  const selectedChartNews = useMemo(
    () =>
      selectedNewsId ? newsEvents.find((item) => item.id === selectedNewsId) ?? null : null,
    [newsEvents, selectedNewsId],
  );

  const newsEventsRef = useRef(newsEvents);
  newsEventsRef.current = newsEvents;
  const rawFeedRecordsRef = useRef(rawFeedRecords);
  rawFeedRecordsRef.current = rawFeedRecords;

  useEffect(() => {
    installBenignResizeObserverErrorSuppression();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-forex-opportunity-app", "");
    document.body.style.overflow = "hidden";

    const welcomeDismissed = window.localStorage.getItem(WELCOME_KEY) === "1";
    const tourDone = window.localStorage.getItem(TOUR_KEY) === "1";
    setWelcomeOpen(!welcomeDismissed);
    setTourOpen(!tourDone && welcomeDismissed);

    return () => {
      document.documentElement.removeAttribute("data-forex-opportunity-app");
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", layoutTheme);
    return () => {
      document.documentElement.removeAttribute("data-theme");
    };
  }, [layoutTheme]);

  useEffect(() => {
    if (!tourOpen || !isMobile) {
      return;
    }

    const step = TOUR_STEPS[tourStep];
    if (!step) {
      return;
    }

    if (step.id === "feed") {
      setMobilePanel("feed");
      return;
    }

    if (step.id === "brief") {
      setMobilePanel("brief");
      return;
    }

    setMobilePanel("chart");
  }, [isMobile, tourOpen, tourStep]);

  useEffect(() => {
    if (!filteredOpportunities.some((item) => item.id === selectedId)) {
      setSelectedId(filteredOpportunities[0]?.id ?? DEFAULT_SIGNAL.id);
    }
  }, [filteredOpportunities, selectedId]);

  useEffect(() => {
    if (!chart || candles.length === 0) {
      return;
    }

    void syncForexNewsFeed(chart, rawFeedRecords, candles, symbol);
  }, [chart, candles, rawFeedRecords, symbol, selectedId]);

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

      setSelectedNewsId(hit.id);
      if (typeof payload.clientX === "number" && typeof payload.clientY === "number") {
        setCalloutAnchor({ clientX: payload.clientX, clientY: payload.clientY });
      } else {
        setCalloutAnchor(null);
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [chart]);

  useEffect(() => {
    if (!chart || candles.length === 0 || !selectedNewsId || newsFocusRequest === 0) {
      return;
    }

    const news = newsEvents.find((item) => item.id === selectedNewsId);
    if (!news) {
      return;
    }

    focusChartOnBar(chart, news.barIndex, { plotCenterRatio: 0.5 });
    setCalloutLayoutToken((token) => token + 1);

    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        suppressScrollToEndRef.current = false;
      });
    } else {
      suppressScrollToEndRef.current = false;
    }
  }, [chart, candles, newsEvents, newsFocusRequest, selectedNewsId]);

  const runScene = useCallback(
    async (signal: ArbSignalRecord, activeCandles: Candle[], instance: ChartInstance) => {
      if (applyingRef.current) {
        return;
      }

      applyingRef.current = true;

      try {
        const shouldFocusViewport = shouldFocusSceneRef.current;
        shouldFocusSceneRef.current = false;

        await applyArbSignalScene(instance, signal, activeCandles, {
          shouldFocusViewport,
        });

        await syncForexNewsFeed(
          instance,
          rawFeedRecordsRef.current,
          activeCandles,
          getSignalSymbol(signal),
        );

        if (!shouldFocusViewport) {
          if (!suppressScrollToEndRef.current) {
            scrollChartToEnd(instance);
          }
        }
      } finally {
        applyingRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    if (!chart || !selectedSignal || candles.length === 0) {
      return;
    }

    void runScene(selectedSignal, candles, chart);
  }, [chart, selectedSignal, candles, runScene]);

  const handleCandlesLoaded = useCallback((loaded: Candle[], meta: ForexChartHostMeta) => {
    adapterRef.current = meta.adapter;
    setCandles(loaded);
  }, []);

  const handleChartReady = useCallback((instance: ChartInstance | null, meta?: ForexChartHostMeta) => {
    chartRef.current = instance;
    setChart(instance);

    if (meta) {
      adapterRef.current = meta.adapter;
      setCandles(meta.candles);
    }
  }, []);

  const syncFromSignal = (signal: ArbSignalRecord, newsId: string | null) => {
    setSelectedId(signal.id);
    setSymbol(getSignalSymbol(signal));
    setTimeframeId(getSignalTimeframeId(signal));
    setSelectedNewsId(newsId);
  };

  const handleSymbolChange = useCallback((nextSymbol: string) => {
    shouldFocusSceneRef.current = false;
    setSymbol(nextSymbol);
  }, []);

  const handleTimeframeChange = useCallback((nextTimeframeId: ForexTimeframeId) => {
    shouldFocusSceneRef.current = false;
    setTimeframeId(nextTimeframeId);
  }, []);

  const handleSelectOpportunity = (id: string) => {
    const signal = FOREX_OPPORTUNITIES.find((item) => item.id === id);
    if (!signal) {
      return;
    }

    shouldFocusSceneRef.current = true;
    syncFromSignal(signal, signal.linkedNewsId ?? null);

    if (isMobile) {
      setMobilePanel("chart");
    }
  };

  const handleSelectNews = (newsId: string) => {
    setCalloutAnchor(null);
    setSelectedNewsId(newsId);
    suppressScrollToEndRef.current = true;
    setNewsFocusRequest((request) => request + 1);

    if (isMobile) {
      setMobilePanel("chart");
    }

    const linked = findArbSignalByNewsId(newsId);
    if (!linked) {
      return;
    }

    if (
      getSignalSymbol(linked) !== symbol ||
      getSignalTimeframeId(linked) !== timeframeId
    ) {
      syncFromSignal(linked, newsId);
      return;
    }

    setSelectedId(linked.id);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  };

  const dismissWelcome = () => {
    window.localStorage.setItem(WELCOME_KEY, "1");
    setWelcomeOpen(false);
    if (window.localStorage.getItem(TOUR_KEY) !== "1") {
      setTourOpen(true);
      setTourStep(0);
    }
  };

  const dismissTour = () => {
    window.localStorage.setItem(TOUR_KEY, "1");
    setTourOpen(false);
  };

  return (
    <div
      className={[styles.shell, layoutTheme === "light" ? styles.shellLight : undefined]
        .filter(Boolean)
        .join(" ")}
      style={TERMINAL_UI_FONT_VARS}
    >
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link className={styles.backLink} to="/starters/forex-platforms">
            ← Back
          </Link>
          <strong className={styles.brandTitle}>FX Opportunity Radar</strong>
          <span className={styles.badge}>
            Demo · {filteredOpportunities.length} opportunities
          </span>
        </div>

        <MarketControls
          symbol={symbol}
          timeframeId={timeframeId}
          dataMode={dataMode}
          onSymbolChange={handleSymbolChange}
          onTimeframeChange={handleTimeframeChange}
        />

        <div className={styles.topBarActions}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setLayoutTheme((current) => (current === "dark" ? "light" : "dark"))}
            title={layoutTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={layoutTheme === "light"}
          >
            {layoutTheme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      {welcomeOpen ? <WelcomeBanner onDismiss={dismissWelcome} /> : null}

      <CalendarStrip
        events={newsEvents}
        selectedNewsId={selectedNewsId}
        onSelectNews={handleSelectNews}
      />

      <div className={styles.filterBar}>
        {OPPORTUNITY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={[styles.filterChip, filter === item.id ? styles.filterChipActive : undefined]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className={styles.mobileTabs}>
        {(
          [
            { id: "feed", label: "Feed" },
            { id: "chart", label: "Chart" },
            { id: "brief", label: "Brief" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            className={[
              styles.mobileTab,
              mobilePanel === item.id ? styles.mobileTabActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setMobilePanel(item.id)}
            aria-pressed={mobilePanel === item.id}
          >
            {item.label}
          </button>
        ))}
      </div>

      <main className={styles.workspace}>
        <div
          className={[
            styles.leftColumn,
            isMobile && mobilePanel === "feed" ? styles.panelVisible : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <OpportunityFeed
            opportunities={filteredOpportunities}
            selectedId={selectedId}
            onSelect={handleSelectOpportunity}
          />
        </div>

        <section
          className={[
            styles.chartColumn,
            !isMobile || mobilePanel === "chart" ? styles.panelVisible : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={styles.chartStack} ref={chartStackRef}>
            <ForexChartHost
              symbol={symbol}
              timeframeId={timeframeId}
              themeVariant={layoutTheme}
              containerRef={chartContainerRef}
              onChartReady={handleChartReady}
              onCandlesLoaded={handleCandlesLoaded}
              onDataModeChange={setDataMode}
            />
            {chart && selectedChartNews ? (
              <NewsChartCallout
                chart={chart}
                news={selectedChartNews}
                containerRef={chartContainerRef}
                stackRef={chartStackRef}
                anchor={calloutAnchor}
                layoutToken={calloutLayoutToken}
                onClose={() => {
                  setCalloutAnchor(null);
                  setSelectedNewsId(null);
                }}
              />
            ) : null}
          </div>
        </section>

        <div
          className={[
            styles.briefSlot,
            isMobile && mobilePanel === "brief" ? styles.panelVisible : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <OpportunityBrief
            opportunity={selectedSignal}
            linkedNews={linkedNews}
            onSaveAlert={() =>
              showToast(`Alert preview: "${selectedSignal?.title}" — wire your rules engine next`)
            }
          />
        </div>
      </main>

      <GuidedTour
        open={tourOpen && !welcomeOpen}
        stepIndex={tourStep}
        onNext={() => setTourStep((step) => step + 1)}
        onDismiss={dismissTour}
      />

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  );
}
