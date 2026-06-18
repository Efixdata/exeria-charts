"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChartInstance } from "@efixdata/exeria-chart";
import { installBenignResizeObserverErrorSuppression } from "@site/src/utils/suppressBenignResizeObserverErrors";
import CommandPalette from "./CommandPalette";
import CryptoTerminalChartHost from "./CryptoTerminalChartHost";
import { getDefaultCompareSymbol } from "./compareSymbol";
import MarketTicker from "./MarketTicker";
import RightDock from "./RightDock";
import ShortcutHelp from "./ShortcutHelp";
import StatsRibbon from "./StatsRibbon";
import WatchlistPanel from "./WatchlistPanel";
import WorkspacePresetMenu from "./WorkspacePresetMenu";
import {
  TIMEFRAMES,
  WATCHLIST_SYMBOLS,
  type RightDockTab,
  type TimeframeId,
} from "./constants";
import type { OpenPosition, SimulatedOrder } from "./mockMarketData";
import { formatPrice } from "./terminalFormat";
import { useBinanceMarketStreams } from "./useBinanceMarketStreams";
import type { AlertDirection, PriceAlert } from "./priceAlerts";
import { formatAlertDirection } from "./priceAlerts";
import { useAlertLineSync } from "./useAlertLineSync";
import { purgeTradeLinesFromChart, syncChartTradeModel } from "./chartTradeModel";
import { resolveChartPriceAtClientY } from "./resolveChartClickPrice";
import { useChartTradeSync } from "./useChartTradeSync";
import {
  useChartRerenderOnLayoutChange,
  useTerminalFullscreenLayout,
  useTerminalViewport,
} from "./useTerminalViewport";
import { usePriceAlertMonitor } from "./usePriceAlertMonitor";
import { useSparklineSeries } from "./useSparklineSeries";
import { useWatchlistStats } from "./useWatchlistStats";
import {
  type WorkspaceLayoutState,
  type WorkspacePresetId,
} from "./workspacePresets";
import styles from "./cryptoTerminalApp.module.css";
import { TERMINAL_UI_FONT_VARS } from "./terminalTypography";

type MobilePanel = "watchlist" | "chart" | "market";

type PriceState = {
  price: number;
  timestamp: number;
  direction: "up" | "down" | "flat";
};

const PRICE_UI_THROTTLE_MS = 250;

type LayoutTheme = "dark" | "light";

export default function CryptoTerminalApp() {
  const chartRef = useRef<ChartInstance | null>(null);
  const [chartInstance, setChartInstance] = useState<ChartInstance | null>(null);
  const orderSyncedForSymbolRef = useRef<string | null>(null);
  const skipPriceSyncRef = useRef(false);
  const lastPriceRef = useRef<number | null>(null);
  const priceThrottleRef = useRef<number | null>(null);
  const flashTimeoutRef = useRef<number | null>(null);
  const pendingPriceRef = useRef<{ price: number; timestamp: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [layoutTheme, setLayoutTheme] = useState<LayoutTheme>("dark");

  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [timeframeId, setTimeframeId] = useState<TimeframeId>("hour");
  const [candleCount, setCandleCount] = useState(0);
  const [priceState, setPriceState] = useState<PriceState | null>(null);
  const [priceFlashClass, setPriceFlashClass] = useState<string | undefined>();
  const [lastTickLabel, setLastTickLabel] = useState("—");

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chart");
  const [rightTab, setRightTab] = useState<RightDockTab>("trade");
  const [toast, setToast] = useState<string | null>(null);

  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderPrice, setOrderPrice] = useState("");
  const [orderSize, setOrderSize] = useState("0.01");
  const [orders, setOrders] = useState<SimulatedOrder[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertPrice, setAlertPrice] = useState("");
  const alertDirection: AlertDirection = "above";
  const [compareMode, setCompareMode] = useState(false);
  const [compareSymbol, setCompareSymbol] = useState("ETHUSDT");
  const [activePresetId, setActivePresetId] = useState<WorkspacePresetId | null>("trader");

  const { isCompact, isMobile } = useTerminalViewport();
  useTerminalFullscreenLayout();

  const { stats: watchlistStats, patchActiveSymbol } = useWatchlistStats(WATCHLIST_SYMBOLS);
  const watchlistStatsRef = useRef(watchlistStats);
  watchlistStatsRef.current = watchlistStats;
  const { series: sparklines } = useSparklineSeries(WATCHLIST_SYMBOLS);
  const { orderBook, trades } = useBinanceMarketStreams(selectedSymbol);
  const activePair = WATCHLIST_SYMBOLS.find((item) => item.id === selectedSymbol);
  const comparePair = WATCHLIST_SYMBOLS.find((item) => item.id === compareSymbol);
  const activeStat = watchlistStats[selectedSymbol];
  const activeAlertCount = alerts.filter((alert) => alert.triggeredAt === undefined).length;

  const markPrices = useMemo(() => {
    const prices: Record<string, number> = {};
    for (const symbol of WATCHLIST_SYMBOLS) {
      const stat = watchlistStats[symbol.id];
      if (stat?.price !== undefined) {
        prices[symbol.id] = stat.price;
      }
    }
    if (priceState?.price !== undefined) {
      prices[selectedSymbol] = priceState.price;
    }
    return prices;
  }, [priceState?.price, selectedSymbol, watchlistStats]);

  const flushPriceUi = useCallback(() => {
    const pending = pendingPriceRef.current;
    if (!pending) {
      return;
    }

    const previous = lastPriceRef.current;
    const direction =
      previous === null
        ? "flat"
        : pending.price > previous
          ? "up"
          : pending.price < previous
            ? "down"
            : "flat";

    lastPriceRef.current = pending.price;
    setPriceState({ price: pending.price, timestamp: pending.timestamp, direction });
    setLastTickLabel(new Date(pending.timestamp).toLocaleTimeString());
    patchActiveSymbol(selectedSymbol, pending.price);

    if (direction === "up" || direction === "down") {
      setPriceFlashClass(direction === "up" ? styles.priceFlashUp : styles.priceFlashDown);
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = window.setTimeout(() => {
        setPriceFlashClass(undefined);
        flashTimeoutRef.current = null;
      }, 450);
    }
  }, [patchActiveSymbol, selectedSymbol]);

  const schedulePriceUiUpdate = useCallback(
    (price: number, timestamp: number) => {
      pendingPriceRef.current = { price, timestamp };

      if (priceThrottleRef.current !== null) {
        return;
      }

      flushPriceUi();
      priceThrottleRef.current = window.setTimeout(() => {
        priceThrottleRef.current = null;
        flushPriceUi();
      }, PRICE_UI_THROTTLE_MS);
    },
    [flushPriceUi],
  );

  const handlePriceTick = useCallback(
    (price: number, timestamp: number) => {
      schedulePriceUiUpdate(price, timestamp);
    },
    [schedulePriceUiUpdate],
  );

  const handleCandleCount = useCallback((count: number) => {
    setCandleCount(count);
  }, []);

  const handleLoadingChange = useCallback((nextLoading: boolean) => {
    setLoading(nextLoading);
  }, []);

  const handleChartReady = useCallback((instance: ChartInstance | null) => {
    chartRef.current = instance;
    setChartInstance(instance);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useChartTradeSync(chartInstance, orders, setOrders, openPositions, setOpenPositions, {
    selectedSymbol,
    markPrices,
    onOrderFilled: (order, fillPrice) => {
      showToast(
        `${order.side === "buy" ? "Buy" : "Sell"} filled @ $${formatPrice(fillPrice)} — position opened`,
      );
      setRightTab("holdings");
    },
    onOrderModified: (_orderId, price, symbol) => {
      if (symbol === selectedSymbol) {
        setOrderPrice(formatPrice(price));
      }
    },
    onPositionClosed: () => {
      showToast("Position closed");
    },
    onOrderCancelled: () => {
      showToast("Order cancelled");
    },
    onBracketOrderAdded: (_positionId, bracketType, price) => {
      showToast(`${bracketType} added @ $${formatPrice(price)}`);
    },
    onPlaceOrderFromChart: (pointer) => {
      const chart = chartRef.current;
      if (!chart) {
        return;
      }

      const container = (chart as ChartInstance & { container?: HTMLElement }).container;
      if (!container) {
        return;
      }

      const price = resolveChartPriceAtClientY(chart, container, pointer.clientY);
      if (price === null) {
        return;
      }

      setOrderPrice(formatPrice(price));
      setRightTab("trade");
      setMobilePanel("market");
      showToast(`Limit price from chart: $${formatPrice(price)}`);
    },
  });

  useAlertLineSync(chartInstance, alerts, setAlerts);

  const handleAlertTriggered = useCallback(
    (alert: PriceAlert, currentPrice: number) => {
      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? { ...item, triggeredAt: Date.now() } : item,
        ),
      );
      showToast(
        `${alert.symbol.replace("USDT", "/USDT")} ${formatAlertDirection(alert.direction).toLowerCase()} $${formatPrice(alert.price)} (now $${formatPrice(currentPrice)})`,
      );
    },
    [showToast],
  );

  usePriceAlertMonitor(alerts, markPrices, { onTrigger: handleAlertTriggered });

  const handleChartClickPrice = useCallback(
    (price: number) => {
      if (rightTab === "alerts") {
        setAlertPrice(formatPrice(price));
        showToast(`Alert price set from chart: $${formatPrice(price)}`);
        return;
      }

      if (rightTab === "orders" || rightTab === "holdings") {
        return;
      }

      setOrderPrice(formatPrice(price));
      setRightTab("trade");
      if (isCompact) {
        setMobilePanel("market");
      }
      showToast(`Limit price set from chart: $${formatPrice(price)}`);
    },
    [isCompact, rightTab, showToast],
  );

  const selectSymbol = useCallback((symbolId: string) => {
    setSelectedSymbol(symbolId);
    setCompareSymbol((current) =>
      current === symbolId ? getDefaultCompareSymbol(symbolId) : current,
    );
    setMobilePanel("chart");
  }, []);

  const applyWorkspaceLayout = useCallback(
    (layout: WorkspaceLayoutState, presetId: WorkspacePresetId) => {
      setFocusMode(layout.focusMode);
      setRightTab(layout.rightTab);
      setMobilePanel(layout.mobilePanel);
      setTimeframeId(layout.timeframeId);
      setActivePresetId(presetId);
    },
    [],
  );

  const currentWorkspaceLayout = useMemo(
    (): WorkspaceLayoutState => ({
      focusMode,
      rightTab,
      mobilePanel,
      timeframeId,
    }),
    [focusMode, mobilePanel, rightTab, timeframeId],
  );

  const handleCancelOrder = useCallback((orderId: string) => {
    if (chartRef.current) {
      purgeTradeLinesFromChart(chartRef.current, { orderIds: [orderId] });
    }
    setOrders((current) => current.filter((item) => item.id !== orderId));
    showToast("Order cancelled");
  }, [showToast]);

  const handleUpdateOrder = useCallback(
    (orderId: string, patch: { price?: number; size?: number }) => {
      setOrders((current) => {
        const next = current.map((item) => {
          if (item.id !== orderId) {
            return item;
          }

          if (patch.price !== undefined && item.symbol === selectedSymbol) {
            setOrderPrice(formatPrice(patch.price));
          }

          return { ...item, ...patch };
        });

        const chart = chartRef.current;
        if (chart) {
          window.requestAnimationFrame(() => {
            syncChartTradeModel(chart, next, openPositions, selectedSymbol, { force: true });
          });
        }

        return next;
      });
      showToast("Order updated");
    },
    [openPositions, selectedSymbol, showToast],
  );

  const handleClosePosition = useCallback((positionId: string) => {
    if (chartRef.current) {
      purgeTradeLinesFromChart(chartRef.current, {
        positionIds: [positionId],
        orderIds: orders
          .filter((order) => order.parentId === positionId)
          .map((order) => order.id),
      });
    }
    setOpenPositions((current) => current.filter((item) => item.id !== positionId));
    setOrders((current) => current.filter((item) => item.parentId !== positionId));
    showToast("Position closed");
  }, [orders, showToast]);

  useChartRerenderOnLayoutChange(
    chartInstance,
    `${mobilePanel}:${focusMode ? "focus" : "normal"}:${isCompact ? "compact" : "wide"}`,
  );

  useEffect(() => {
    if (focusMode && isMobile) {
      setMobilePanel("chart");
    }
  }, [focusMode, isMobile]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", layoutTheme);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [layoutTheme]);

  useEffect(() => installBenignResizeObserverErrorSuppression(), []);

  useEffect(() => {
    return () => {
      if (priceThrottleRef.current !== null) {
        window.clearTimeout(priceThrottleRef.current);
      }
      if (flashTimeoutRef.current !== null) {
        window.clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    skipPriceSyncRef.current = true;
    lastPriceRef.current = null;
    pendingPriceRef.current = null;
    setPriceState(null);
    setLastTickLabel("—");

    const stat = watchlistStatsRef.current[selectedSymbol];
    if (stat?.price !== undefined) {
      setOrderPrice(formatPrice(stat.price));
      orderSyncedForSymbolRef.current = selectedSymbol;
    } else {
      setOrderPrice("");
      orderSyncedForSymbolRef.current = null;
    }
  }, [selectedSymbol, timeframeId]);

  useEffect(() => {
    if (skipPriceSyncRef.current) {
      skipPriceSyncRef.current = false;
      return;
    }
    if (!priceState || orderSyncedForSymbolRef.current === selectedSymbol) {
      return;
    }
    orderSyncedForSymbolRef.current = selectedSymbol;
    setOrderPrice(formatPrice(priceState.price));
  }, [priceState, selectedSymbol]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (typing) {
        return;
      }

      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        setFocusMode((value) => !value);
        return;
      }

      if (event.key >= "1" && event.key <= "6") {
        const index = Number.parseInt(event.key, 10) - 1;
        const symbol = WATCHLIST_SYMBOLS[index];
        if (symbol) {
          selectSymbol(symbol.id);
        }
      }

      if (event.key === "Escape") {
        setPaletteOpen(false);
        setHelpOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectSymbol]);

  const handleAddAlert = () => {
    if (!chartRef.current) {
      showToast("Chart is still loading.");
      return;
    }

    const parsedPrice = Number.parseFloat(alertPrice.replace(/,/g, ""));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      showToast("Enter a valid alert price.");
      return;
    }

    const alertId = `alert-${Date.now()}`;
    const lineId = chartRef.current.toolDrawer.drawTool({
      type: "hLine",
      alertId,
      anchors: [
        {
          stamp: Date.now(),
          offset: 0,
          value: parsedPrice,
          _index: 0,
        },
      ],
      color: "#f59e0b",
      text: `Alert ${alertDirection}`,
      editable: true,
    });

    // @ts-ignore
    const alert: PriceAlert = {
      id: alertId,
      symbol: selectedSymbol,
      price: parsedPrice,
      direction: alertDirection,
      createdAt: Date.now(),
      lineId: lineId ?? undefined,
    };

    setAlerts((current) => [alert, ...current].slice(0, 16));
    showToast(
      `Alert set: ${formatAlertDirection(alertDirection).toLowerCase()} $${formatPrice(parsedPrice)}`,
    );
  };

  const handleRemoveAlert = useCallback((alertId: string) => {
    setAlerts((current) => {
      const alert = current.find((item) => item.id === alertId);
      if (alert?.lineId !== undefined && chartRef.current) {
        chartRef.current.removeChartDrawing(alert.lineId);
      }
      return current.filter((item) => item.id !== alertId);
    });
  }, []);

  const handlePlaceOrder = () => {
    if (!chartRef.current) {
      showToast("Chart is still loading.");
      return;
    }

    const price = Number.parseFloat(orderPrice.replace(/,/g, ""));

    if (!Number.isFinite(price) || price <= 0) {
      showToast("Enter a valid limit price.");
      return;
    }

    const order: SimulatedOrder = {
      id: `ord-${Date.now()}`,
      symbol: selectedSymbol,
      side: orderSide,
      price,
      size: Number.parseFloat(orderSize) || 0.01,
      placedAt: Date.now(),
    };

    setOrders((current) => [order, ...current].slice(0, 16));
    setRightTab("orders");
    showToast(`${orderSide === "buy" ? "Buy" : "Sell"} limit @ $${formatPrice(price)}`);
  };

  const priceClass =
    priceState?.direction === "up"
      ? styles.priceUp
      : priceState?.direction === "down"
        ? styles.priceDown
        : undefined;

  return (
    <div
      className={[
        styles.shell,
        styles.shellInvestor,
        layoutTheme === "light" ? styles.shellLight : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
      style={TERMINAL_UI_FONT_VARS}
    >
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <a className={styles.backLink} href="/starters/crypto-terminal">
            ← Case study
          </a>
          <span className={styles.brand}>Crypto Terminal Pro</span>
        </div>

        <div className={styles.topBarCenter}>
          <MarketTicker />
        </div>

        <div className={styles.topBarRight}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setLayoutTheme((current) => (current === "dark" ? "light" : "dark"))}
            title={layoutTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={layoutTheme === "light"}
          >
            {layoutTheme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            className={[styles.ghostButton, focusMode ? styles.chipButtonActive : undefined]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setFocusMode((value) => !value)}
            title="Focus chart (F)"
          >
            Focus
          </button>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setPaletteOpen(true)}
            title="Jump to symbol (⌘K)"
          >
            ⌘K
          </button>
          <WorkspacePresetMenu
            activePresetId={activePresetId}
            currentLayout={currentWorkspaceLayout}
            onApply={applyWorkspaceLayout}
          />
          <a
            className={[styles.ghostButton, styles.compactHidden].filter(Boolean).join(" ")}
            href="/docs/getting-started/vite-react"
          >
            Docs
          </a>
        </div>
      </header>

      {/* @ts-ignore */}
      <StatsRibbon
        pair={activePair?.pair ?? selectedSymbol}
        price={priceState?.price}
        bid={orderBook.bids[0]?.price}
        ask={orderBook.asks[0]?.price}
        changePercent={activeStat?.changePercent}
        high24h={activeStat?.highPrice}
        low24h={activeStat?.lowPrice}
        volumeQuote={activeStat?.volumeQuote}
        spreadBps={orderBook.spreadBps}
        loading={loading}
      />

      <div className={styles.instrumentBar}>
        <div className={styles.timeframeGroup}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              className={[
                styles.chipButton,
                timeframeId === tf.id ? styles.chipButtonActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setTimeframeId(tf.id)}
              disabled={loading}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className={styles.instrumentBarRight}>
          <button
            type="button"
            className={[
              styles.chipButton,
              compareMode ? styles.chipButtonActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setCompareMode((value) => !value)}
            title="Overlay a second instrument on the chart"
          >
            Compare
          </button>
          {priceState ? (
            <span
              className={[styles.instrumentLivePrice, priceClass, priceFlashClass]
                .filter(Boolean)
                .join(" ")}
            >
              Live ${formatPrice(priceState.price)}
            </span>
          ) : null}
        </div>
      </div>

      {compareMode ? (
        <div className={styles.compareBar}>
          <span className={styles.compareBarLabel}>Compare with</span>
          {WATCHLIST_SYMBOLS.filter((item) => item.id !== selectedSymbol).map((item) => (
            <button
              key={item.id}
              type="button"
              className={[
                styles.chipButton,
                compareSymbol === item.id ? styles.chipButtonActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setCompareSymbol(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={styles.mobileTabs}>
        {(["watchlist", "chart", "market"] as MobilePanel[]).map((panel) => (
          <button
            key={panel}
            type="button"
            className={[
              styles.chipButton,
              mobilePanel === panel ? styles.chipButtonActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setMobilePanel(panel)}
          >
            {panel === "watchlist" ? "Markets" : panel === "market" ? "Trade+" : "Chart"}
          </button>
        ))}
      </div>

      <div
        className={[
          styles.workspace,
          focusMode ? styles.workspaceFocus : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className={[
            styles.watchlistSlot,
            !focusMode && mobilePanel === "watchlist" ? styles.panelVisible : undefined,
            focusMode ? styles.panelHidden : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* @ts-ignore */}
          <WatchlistPanel
            symbols={WATCHLIST_SYMBOLS}
            selectedSymbol={selectedSymbol}
            stats={watchlistStats}
            sparklines={sparklines}
            livePrice={priceState?.price}
            onSelect={selectSymbol}
          />
        </div>

        <section
            className={[
              styles.chartColumn,
              mobilePanel === "chart" || focusMode ? styles.panelVisible : undefined,
            ]
            .filter(Boolean)
            .join(" ")}
        >
          <CryptoTerminalChartHost
            selectedSymbol={selectedSymbol}
            symbolLabel={activePair?.pair ?? selectedSymbol}
            timeframeId={timeframeId}
            themeVariant={layoutTheme}
            compareSymbol={compareMode ? compareSymbol : null}
            compareLabel={comparePair?.pair ?? compareSymbol}
            onPriceTick={handlePriceTick}
            onCandleCount={handleCandleCount}
            onLoadingChange={handleLoadingChange}
            onError={() => undefined}
            onChartReady={handleChartReady}
            onChartClickPrice={handleChartClickPrice}
          />
        </section>

        <div
          className={[
            styles.marketSlot,
            !focusMode && mobilePanel === "market" ? styles.panelVisible : undefined,
            focusMode ? styles.panelHidden : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {/* @ts-ignore */}
          <RightDock
            activeTab={rightTab}
            onTabChange={setRightTab}
            orderSide={orderSide}
            orderPrice={orderPrice}
            orderSize={orderSize}
            onOrderSideChange={setOrderSide}
            onOrderPriceChange={setOrderPrice}
            onOrderSizeChange={setOrderSize}
            onPlaceOrder={handlePlaceOrder}
            onSyncPrice={() => {
              if (priceState) {
                setOrderPrice(formatPrice(priceState.price));
              }
            }}
            bids={orderBook.bids}
            asks={orderBook.asks}
            spread={orderBook.spread}
            spreadBps={orderBook.spreadBps}
            trades={trades}
            orders={orders}
            openPositions={openPositions}
            markPrices={markPrices}
            onCancelOrder={handleCancelOrder}
            onUpdateOrder={handleUpdateOrder}
            onClosePosition={handleClosePosition}
            alerts={alerts}
            alertPrice={alertPrice}
            livePrice={priceState?.price}
            selectedSymbol={selectedSymbol}
            onAlertPriceChange={setAlertPrice}
            onAddAlert={handleAddAlert}
            onRemoveAlert={handleRemoveAlert}
          />
        </div>
      </div>

      <footer className={styles.statusBar}>
        <span className={styles.statusLive}>
          <span className={styles.statusDot} aria-hidden />
          Live chart
        </span>
        <span>{candleCount > 0 ? `${candleCount.toLocaleString()} candles` : "Loading history"}</span>
        <span>Last tick {lastTickLabel}</span>
        <span>
          {orders.length} orders · {openPositions.length}{" "}
          positions
        </span>
        {activeAlertCount > 0 ? <span>{activeAlertCount} price alerts</span> : null}
        <span>Powered by Exeria Charts</span>
      </footer>

      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <CommandPalette
        open={paletteOpen}
        symbols={WATCHLIST_SYMBOLS}
        onClose={() => setPaletteOpen(false)}
        onSelect={selectSymbol}
      />
      <ShortcutHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
