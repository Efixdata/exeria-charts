"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "@docusaurus/Link";
import { installBenignResizeObserverErrorSuppression } from "@site/src/utils/suppressBenignResizeObserverErrors";
import { WATCHLIST_SYMBOLS } from "../CryptoTerminalApp/constants";
import { TERMINAL_UI_FONT_VARS } from "../CryptoTerminalApp/terminalTypography";
import { useTerminalFullscreenLayout } from "../CryptoTerminalApp/useTerminalViewport";
import { useWatchlistStats } from "../CryptoTerminalApp/useWatchlistStats";
import SignalFiltersBar from "./SignalFiltersBar";
import SignalScreenerList from "./SignalScreenerList";
import SettingsDrawer from "./SettingsDrawer";
import type { TimeframeId } from "./constants";
import { DEFAULT_FILTERS, filterSignals, type SignalFilters } from "./signalCatalog";
import { useScreenerSignals } from "./useScreenerSignals";
import styles from "./signalTerminalApp.module.css";

type SettingsTab = "alerts" | "automation" | "rules";

export default function SignalTerminalApp() {
  const [filters, setFilters] = useState<SignalFilters>(DEFAULT_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timeframeId, setTimeframeId] = useState<TimeframeId>("hour");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("alerts");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});

  useTerminalFullscreenLayout();

  const { signals: allSignals, loading: signalsLoading, error: signalsError } = useScreenerSignals();
  const filteredSignals = useMemo(
    () => filterSignals(allSignals, filters),
    [allSignals, filters],
  );

  const { stats: watchlistStats } = useWatchlistStats(WATCHLIST_SYMBOLS);
  const marketPrices = useMemo(() => {
    const prices: Record<string, number> = { ...livePrices };
    for (const item of WATCHLIST_SYMBOLS) {
      const stat = watchlistStats[item.id];
      if (stat?.price !== undefined) {
        prices[item.id] = stat.price;
      }
    }
    return prices;
  }, [livePrices, watchlistStats]);

  useEffect(() => {
    installBenignResizeObserverErrorSuppression();
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleFilterChange = (patch: Partial<SignalFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const openSettings = (tab: SettingsTab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handlePriceTick = (symbol: string, price: number) => {
    setLivePrices((current) => ({ ...current, [symbol]: price }));
  };

  return (
    <div className={styles.shell} style={TERMINAL_UI_FONT_VARS}>
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link className={styles.backLink ?? ""} to="/starters/screener-signals">
            ← Back
          </Link>
          <strong className={styles.brandTitle}>Signal Screener</strong>
          <span className={styles.resultCount}>{filteredSignals.length} signals</span>
        </div>

        <div className={styles.topBarActions}>
          <button type="button" className={styles.ghostButton} onClick={() => openSettings("alerts")}>
            Alerts
          </button>
          <button type="button" className={styles.ghostButton} onClick={() => openSettings("automation")}>
            Automation
          </button>
          <button type="button" className={styles.ghostButton} onClick={() => openSettings("rules")}>
            My signals
          </button>
        </div>
      </header>

      <SignalFiltersBar filters={filters} onChange={handleFilterChange} />

      <main className={styles.screenerMain}>
        {signalsLoading ? (
          <div className={styles.screenerContent}>
            <p className={styles.emptyList}>Loading 1H screener signals…</p>
          </div>
        ) : null}
        {signalsError ? (
          <div className={styles.screenerContent}>
            <p className={styles.emptyList}>{signalsError}</p>
          </div>
        ) : null}
        {!signalsLoading && !signalsError ? (
          <SignalScreenerList
            signals={filteredSignals}
            expandedId={expandedId}
            marketPrices={marketPrices}
            timeframeId={timeframeId}
            onToggle={handleToggle}
            onPriceTick={handlePriceTick}
          />
        ) : null}
      </main>

      <SettingsDrawer
        open={settingsOpen}
        initialTab={settingsTab}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
