"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "@docusaurus/Link";
import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import { installBenignResizeObserverErrorSuppression } from "@site/src/utils/suppressBenignResizeObserverErrors";
import { TERMINAL_UI_FONT_VARS } from "../CryptoTerminalApp/terminalTypography";
import {
  useChartRerenderOnLayoutChange,
  useTerminalViewport,
} from "../CryptoTerminalApp/useTerminalViewport";
import MarketControls from "../ForexOpportunityApp/MarketControls";
import { scrollChartToEnd } from "../ForexOpportunityApp/chartBarPosition";
import type { ForexTimeframeId } from "../ForexOpportunityApp/forexInstruments";
import QuantChartHost, { type QuantChartHostMeta } from "./QuantChartHost";
import { applyQuantPreset } from "./applyQuantPreset";
import { clearQuantChartScripts } from "./clearQuantScripts";
import { DEFAULT_SYMBOL, DEFAULT_TIMEFRAME_ID, type QuantAppTheme } from "./constants";
import {
  DEFAULT_PRESET_ID,
  QUANT_PRESETS,
  findQuantPreset,
  type QuantPresetId,
} from "./strategyPresets";
import styles from "./quantAnalyticsApp.module.css";

type MobilePanel = "chart" | "strategy";

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

export default function QuantAnalyticsApp() {
  const chartRef = useRef<ChartInstance | null>(null);
  const applyingPresetRef = useRef(false);

  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL);
  const [timeframeId, setTimeframeId] = useState<ForexTimeframeId>(DEFAULT_TIMEFRAME_ID);
  const [presetId, setPresetId] = useState<QuantPresetId>(DEFAULT_PRESET_ID);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [layoutTheme, setLayoutTheme] = useState<QuantAppTheme>("dark");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");
  const [layoutKey, setLayoutKey] = useState(0);

  const { isCompact } = useTerminalViewport();
  const activePreset = findQuantPreset(presetId);

  useChartRerenderOnLayoutChange(chart, `${layoutKey}-${isCompact}-${mobilePanel}`);

  useEffect(() => {
    installBenignResizeObserverErrorSuppression();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-quant-analytics-app", "");
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.removeAttribute("data-quant-analytics-app");
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setLayoutKey((current) => current + 1);
  }, [isCompact, layoutTheme, mobilePanel, presetId]);

  const runPreset = useCallback(
    async (instance: ChartInstance, activeCandles: Candle[]) => {
      if (applyingPresetRef.current || activeCandles.length === 0) {
        return;
      }

      applyingPresetRef.current = true;

      try {
        await clearQuantChartScripts(instance);
        await applyQuantPreset(instance, presetId);
        await waitForFrame();
        scrollChartToEnd(instance);
      } finally {
        applyingPresetRef.current = false;
      }
    },
    [presetId],
  );

  useEffect(() => {
    if (!chart || candles.length === 0) {
      return;
    }

    void runPreset(chart, candles);
  }, [chart, candles, runPreset]);

  const handleCandlesLoaded = useCallback((loaded: Candle[]) => {
    setCandles(loaded);
  }, []);

  const handleChartReady = useCallback((instance: ChartInstance | null, meta?: QuantChartHostMeta) => {
    chartRef.current = instance;
    setChart(instance);

    if (meta) {
      setCandles(meta.candles);
    }
  }, []);

  const handleSymbolChange = useCallback((nextSymbol: string) => {
    setSymbol(nextSymbol);
    setCandles([]);
  }, []);

  const handleTimeframeChange = useCallback((nextTimeframeId: ForexTimeframeId) => {
    setTimeframeId(nextTimeframeId);
    setCandles([]);
  }, []);

  const handlePresetChange = useCallback((nextPresetId: QuantPresetId) => {
    setPresetId(nextPresetId);
    if (isCompact) {
      setMobilePanel("chart");
    }
  }, [isCompact]);

  const renderPresetList = () => (
    <div className={styles.presetList}>
      {QUANT_PRESETS.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={[
            styles.presetButton,
            preset.id === presetId ? styles.presetButtonActive : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => handlePresetChange(preset.id)}
        >
          <span className={styles.presetLabel}>{preset.label}</span>
          <span className={styles.presetDescription}>{preset.description}</span>
          <span className={styles.scriptTags}>
            {preset.scripts.map((script) => (
              <span key={script} className={styles.scriptTag}>
                {script}
              </span>
            ))}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <div
      className={[styles.shell, layoutTheme === "light" ? styles.shellLight : undefined]
        .filter(Boolean)
        .join(" ")}
      style={TERMINAL_UI_FONT_VARS}
    >
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link className={styles.backLink} to="/starters/quant-analytics">
            <span className={styles.backLinkFull}>← Back to starter</span>
            <span className={styles.backLinkShort}>← Back</span>
          </Link>
          <span className={styles.brandTitle}>Quant Analytics</span>
          <span className={styles.badge}>Backtest demo</span>
        </div>

        <div className={styles.topBarRight}>
          <div className={styles.marketControlsSlot}>
            <MarketControls
              symbol={symbol}
              timeframeId={timeframeId}
              dataMode="static"
              onSymbolChange={handleSymbolChange}
              onTimeframeChange={handleTimeframeChange}
            />
          </div>
          <div className={styles.topBarActions}>
            <button
              type="button"
              className={styles.themeToggle}
              onClick={() => setLayoutTheme((current) => (current === "dark" ? "light" : "dark"))}
              title={layoutTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-pressed={layoutTheme === "light"}
            >
              {layoutTheme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </header>

      <div className={styles.mobileTabs}>
        {(
          [
            { id: "chart", label: "Chart" },
            { id: "strategy", label: "Strategy" },
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

      {isCompact && mobilePanel === "chart" ? (
        <div className={styles.mobilePresetBar}>
          <span className={styles.mobilePresetLabel}>Model</span>
          {QUANT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={[
                styles.mobilePresetChip,
                preset.id === presetId ? styles.mobilePresetChipActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => handlePresetChange(preset.id)}
            >
              {preset.shortLabel}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.body}>
        <aside
          className={[
            styles.sidebar,
            isCompact && mobilePanel === "strategy" ? styles.panelVisible : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <section className={styles.sidebarSection}>
            <h2>Strategy model</h2>
            <p className={styles.sidebarHint}>
              Preset defines indicators and rules on the chart. Pair and timeframe above set the
              OHLC series.
            </p>
            {renderPresetList()}
          </section>
        </aside>

        <section
          className={[
            styles.chartColumn,
            !isCompact || mobilePanel === "chart" ? styles.panelVisible : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {isCompact ? (
            <div className={styles.mobileChartMeta}>
              <span className={styles.mobileChartMetaLabel}>Active model</span>
              <strong>{activePreset.label}</strong>
              <span className={styles.mobileChartMetaScripts}>
                {activePreset.scripts.join(" · ")}
              </span>
            </div>
          ) : null}
          <QuantChartHost
            symbol={symbol}
            timeframeId={timeframeId}
            themeVariant={layoutTheme}
            onChartReady={handleChartReady}
            onCandlesLoaded={handleCandlesLoaded}
          />
        </section>
      </div>
    </div>
  );
}
