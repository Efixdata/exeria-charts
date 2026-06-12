"use client";

import { useCallback, useMemo, useState } from "react";
import { useTerminalFullscreenLayout } from "../CryptoTerminalApp/useTerminalViewport";
import ActivityFeed from "./ActivityFeed";
import AllocationRing from "./AllocationRing";
import AssetDetailSheet from "./AssetDetailSheet";
import CashRow from "./CashRow";
import ChartLegend from "./ChartLegend";
import FintechCompareChart from "./FintechCompareChart";
import HoldingCard from "./HoldingCard";
import InsightStrip from "./InsightStrip";
import RebalanceCard from "./RebalanceCard";
import WatchlistStrip from "./WatchlistStrip";
import {
  buildActivityFeed,
  computeRebalanceSuggestions,
} from "./wealthAnalytics";
import {
  FINTECH_APP_NAME,
  FINTECH_PERIODS,
  type FintechPeriodId,
  type FintechViewId,
} from "./constants";
import type { AssetPerformance } from "./fintechCompareChartSetup";
import {
  FINTECH_MARKET_PRESETS,
  getMarketPreset,
  type FintechMarketId,
} from "./marketPresets";
import { buildHoldings, computePortfolioSummary } from "./portfolioModel";
import { usePullToRefresh } from "./usePullToRefresh";
import { useWatchlistSparklines } from "./useWatchlistSparklines";
import styles from "./fintechWealthApp.module.css";

type LayoutTheme = "dark" | "light";
type BrandVariant = "consumer" | "bank";

type FintechWealthAppProps = {
  defaultTheme?: LayoutTheme;
  brandVariant?: BrandVariant;
  lockTheme?: boolean;
};

const MASKED_BALANCE = "••••••";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function toneForChange(value: number): "up" | "down" {
  return value >= 0 ? "up" : "down";
}

function readGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

function readBrandMark(brandVariant: BrandVariant, layoutTheme: LayoutTheme): string {
  if (brandVariant === "bank") {
    return "Retail banking demo";
  }

  return layoutTheme === "light" ? "Neo-broker demo" : "Private banking demo";
}

export default function FintechWealthApp({
  defaultTheme = "dark",
  brandVariant = "consumer",
  lockTheme = false,
}: FintechWealthAppProps) {
  useTerminalFullscreenLayout();

  const [marketId, setMarketId] = useState<FintechMarketId>("equities");
  const [periodId, setPeriodId] = useState<FintechPeriodId>("1m");
  const [viewId, setViewId] = useState<FintechViewId>("overview");
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>(defaultTheme);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [performance, setPerformance] = useState<AssetPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedAssetId, setFocusedAssetId] = useState<string | null>(null);
  const [detailAssetId, setDetailAssetId] = useState<string | null>(null);
  const [compareResetKey, setCompareResetKey] = useState(0);

  const market = getMarketPreset(marketId);
  const activePeriod = FINTECH_PERIODS.find((entry) => entry.id === periodId) ?? FINTECH_PERIODS[2]!;

  const { series: watchlistSeries, loading: watchlistLoading } = useWatchlistSparklines(
    market.watchlist,
    marketId,
    refreshKey,
  );

  const handleRefresh = useCallback(() => {
    setPerformance([]);
    setLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  const { handlers: pullHandlers, pullDistance, refreshing, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const portfolioSummary = useMemo(() => {
    if (performance.length === 0) {
      return computePortfolioSummary([], marketId);
    }

    return computePortfolioSummary(performance, marketId);
  }, [marketId, performance]);

  const holdings = useMemo(() => buildHoldings(performance, marketId), [marketId, performance]);

  const rebalanceSuggestion = useMemo(
    () => computeRebalanceSuggestions(holdings),
    [holdings],
  );

  const activityEvents = useMemo(
    () => buildActivityFeed(holdings, marketId, portfolioSummary.cashEur),
    [holdings, marketId, portfolioSummary.cashEur],
  );

  const detailRow = useMemo(
    () => holdings.find((row) => row.asset.id === detailAssetId) ?? null,
    [detailAssetId, holdings],
  );

  const handlePerformanceChange = useCallback((rows: AssetPerformance[]) => {
    setPerformance(rows);
  }, []);

  const handleMarketChange = useCallback((nextMarketId: FintechMarketId) => {
    setMarketId(nextMarketId);
    setFocusedAssetId(null);
    setDetailAssetId(null);
    setPerformance([]);
    setLoading(true);
  }, []);

  const handleLegendSelect = useCallback((assetId: string | null) => {
    setFocusedAssetId(assetId);
  }, []);

  const handleHoldingSelect = useCallback((assetId: string) => {
    setFocusedAssetId((current) => (current === assetId ? null : assetId));
    setDetailAssetId(assetId);
  }, []);

  const handleDetailClose = useCallback(() => {
    setDetailAssetId(null);
    setCompareResetKey((value) => value + 1);
  }, []);

  const shellClassName = [
    styles.shell,
    layoutTheme === "light" ? styles.shellLight : undefined,
    brandVariant === "bank" ? styles.shellBank : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={shellClassName}
      data-testid="fintech-wealth-app"
      data-theme={layoutTheme}
      data-brand={brandVariant}
    >
      <div className={styles.frame}>
        <header className={styles.topBar}>
          <div className={styles.brand}>
            <div className={styles.avatar} aria-hidden>
              NW
            </div>
            <div>
              <span className={styles.brandMark}>{readBrandMark(brandVariant, layoutTheme)}</span>
              <h1 className={styles.brandTitle}>{FINTECH_APP_NAME}</h1>
            </div>
          </div>
          {lockTheme ? null : (
            <div className={styles.topBarActions}>
              <button
                type="button"
                className={styles.ghostButton}
                onClick={() => setLayoutTheme((current) => (current === "dark" ? "light" : "dark"))}
                title={layoutTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                aria-label={
                  layoutTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"
                }
                aria-pressed={layoutTheme === "light"}
              >
                {layoutTheme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          )}
        </header>

        <div
          className={styles.scrollBody}
          data-refreshing={refreshing ? "true" : "false"}
          {...pullHandlers}
        >
          <div
            className={styles.pullIndicator}
            style={{ height: `${pullDistance}px` }}
            aria-hidden={pullDistance === 0 && !refreshing}
          >
            <span className={styles.pullIndicatorLabel} data-ready={pullProgress >= 1 ? "true" : "false"}>
              {refreshing ? "Refreshing…" : pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>

        <div className={styles.marketToggle} role="tablist" aria-label="Market">
          {(Object.keys(FINTECH_MARKET_PRESETS) as FintechMarketId[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={marketId === id}
              className={styles.marketToggleButton}
              data-active={marketId === id ? "true" : "false"}
              onClick={() => handleMarketChange(id)}
            >
              {FINTECH_MARKET_PRESETS[id].label}
            </button>
          ))}
        </div>

        <section className={styles.hero} aria-label="Portfolio summary">
          <p className={styles.greeting}>{readGreeting()}, Alex</p>
          <div className={styles.portfolioHeader}>
            <p className={styles.portfolioLabel}>Total portfolio</p>
            <button
              type="button"
              className={styles.balanceToggle}
              onClick={() => setBalanceHidden((value) => !value)}
              aria-pressed={balanceHidden}
              aria-label={balanceHidden ? "Show balance" : "Hide balance"}
              title={balanceHidden ? "Show balance" : "Hide balance"}
            >
              <span className={styles.balanceToggleIcon} aria-hidden>
                {balanceHidden ? "◉" : "◎"}
              </span>
            </button>
          </div>
          {balanceHidden ? (
            <span className={styles.srOnly}>Portfolio balance hidden</span>
          ) : null}
          <p
            className={styles.portfolioValue}
            data-ready={!loading || performance.length > 0 ? "true" : "false"}
            aria-hidden={balanceHidden}
            aria-live="polite"
          >
            {loading && performance.length === 0
              ? "—"
              : balanceHidden
                ? MASKED_BALANCE
                : formatCurrency(portfolioSummary.totalValueEur)}
          </p>
          <p
            className={styles.portfolioChange}
            data-tone={toneForChange(portfolioSummary.changePercent)}
            aria-hidden={balanceHidden}
          >
            {loading && performance.length === 0
              ? "Syncing market data…"
              : balanceHidden
                ? "••••"
                : `${portfolioSummary.changeAmountEur >= 0 ? "+" : ""}${formatCurrency(
                    portfolioSummary.changeAmountEur,
                  )} (${formatPercent(portfolioSummary.changePercent)})`}
          </p>
        </section>

        <CashRow
          cashEur={portfolioSummary.cashEur}
          investedEur={portfolioSummary.investedEur}
          loading={loading && performance.length === 0}
          balanceHidden={balanceHidden}
        />

        <InsightStrip
          holdings={holdings}
          portfolioChangePercent={portfolioSummary.changePercent}
          portfolioValueEur={portfolioSummary.totalValueEur}
          savingsGoalEur={market.savingsGoalEur}
          rebalanceSuggestion={rebalanceSuggestion}
          loading={loading && performance.length === 0}
          balanceHidden={balanceHidden}
        />

        <div className={styles.viewToggle} role="tablist" aria-label="Portfolio views">
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "holdings", label: "Holdings" },
            ] as const
          ).map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={viewId === view.id}
              className={styles.viewToggleButton}
              data-active={viewId === view.id ? "true" : "false"}
              onClick={() => setViewId(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>

        {viewId === "overview" ? (
          <div className={styles.periodRow} role="tablist" aria-label="Performance period">
            {FINTECH_PERIODS.map((period) => (
              <button
                key={period.id}
                type="button"
                role="tab"
                aria-selected={periodId === period.id}
                className={styles.periodPill}
                data-active={periodId === period.id ? "true" : "false"}
                onClick={() => setPeriodId(period.id)}
              >
                {period.label}
              </button>
            ))}
          </div>
        ) : null}

        <section
          className={styles.chartSection}
          aria-label="Portfolio performance comparison"
          aria-busy={loading}
          aria-hidden={viewId !== "overview"}
          data-offscreen={viewId !== "overview" ? "true" : "false"}
        >
          {viewId === "overview" ? (
            <ChartLegend
              rows={performance}
              focusedAssetId={focusedAssetId}
              onSelect={handleLegendSelect}
            />
          ) : null}
          <FintechCompareChart
            marketId={marketId}
            assets={market.assets}
            periodId={periodId}
            interval={activePeriod.interval}
            limit={activePeriod.limit}
            focusedAssetId={focusedAssetId}
            themeVariant={layoutTheme}
            refreshKey={refreshKey}
            resetKey={compareResetKey}
            onPerformanceChange={handlePerformanceChange}
            onLoadingChange={setLoading}
            onError={() => undefined}
          />
        </section>

        {viewId === "overview" ? (
          <>
            <section className={styles.allocationSection} aria-label="Allocation">
              <div className={styles.sectionHeading}>
                <h2 className={styles.sectionTitle}>Allocation</h2>
                <span className={styles.sectionHint}>Live weights</span>
              </div>
              <AllocationRing holdings={holdings} />
            </section>

            <RebalanceCard
              suggestion={rebalanceSuggestion}
              loading={loading && performance.length === 0}
            />

            <ActivityFeed
              events={activityEvents}
              loading={loading && performance.length === 0}
              balanceHidden={balanceHidden}
            />

            <WatchlistStrip
              items={market.watchlist}
              marketId={marketId}
              series={watchlistSeries}
              loading={watchlistLoading}
            />
          </>
        ) : null}

        {viewId === "holdings" ? (
          <section className={styles.holdings} aria-label="Holdings">
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>Your holdings</h2>
              <span className={styles.sectionHint}>Tap for detail</span>
            </div>
            {holdings.map((row) => (
              <HoldingCard
                key={row.asset.id}
                row={row}
                marketId={marketId}
                focused={focusedAssetId === row.asset.id}
                onSelect={() => handleHoldingSelect(row.asset.id)}
              />
            ))}
          </section>
        ) : null}

        </div>

        <nav className={styles.bottomNav} aria-label="Primary actions">
          <button type="button" className={styles.bottomNavButton} data-active="true" aria-current="page">
            <span className={styles.bottomNavIcon} aria-hidden>
              ◉
            </span>
            Home
          </button>
          <button type="button" className={styles.bottomNavButton} data-primary="true" aria-label="Invest (demo)">
            <span className={styles.bottomNavIcon} aria-hidden>
              +
            </span>
            Invest
          </button>
          <button type="button" className={styles.bottomNavButton} aria-label="More options (demo)">
            <span className={styles.bottomNavIcon} aria-hidden>
              ≡
            </span>
            More
          </button>
        </nav>
      </div>

      <AssetDetailSheet
        row={detailRow}
        marketId={marketId}
        periodId={periodId}
        interval={activePeriod.interval}
        limit={activePeriod.limit}
        themeVariant={layoutTheme}
        onClose={handleDetailClose}
      />

    </div>
  );
}
