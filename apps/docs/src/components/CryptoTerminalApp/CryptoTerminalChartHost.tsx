"use client";

import { memo, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import { BinanceAdapter } from "../../../../../packages/adapter-binance/src";
import type { ChartUITheme } from "../../../../../packages/react-chart-ui/src/chartTypes";
import { loadChartUI } from "@site/src/utils/loadChartUI";
import {
  applyChartSettingsPreset,
  buildChartSettingsPresetUiTheme,
} from "../themeCreator/applyChartSettingsPreset";
import { themePresets } from "../themeCreator/chartSettingsThemePresets";
import { buildChartTheme, type ThemeVariant } from "../themeCreator/core";
import type { TimeframeId } from "./constants";
import { TIMEFRAMES } from "./constants";
import { applyChartOverlay, removeChartOverlay } from "./chartCompareOverlay";
import { activatePointer, applyCryptoTerminalScene } from "./chartScene";
import {
  resolveChartClickPrice,
  shouldIgnoreChartClickForOrderPrice,
} from "./resolveChartClickPrice";
import styles from "./cryptoTerminalApp.module.css";

const COMPARE_OVERLAY_COLOR = "#2962FF";

type CryptoTerminalChartHostProps = {
  selectedSymbol: string;
  symbolLabel: string;
  timeframeId: TimeframeId;
  themeVariant?: ThemeVariant;
  onPriceTick: (price: number, timestamp: number) => void;
  onCandleCount: (count: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
  onChartReady: (chart: ChartInstance | null) => void;
  onChartClickPrice?: (price: number) => void;
  compareSymbol?: string | null;
  compareLabel?: string;
};

function getChartPresetId(themeVariant: ThemeVariant) {
  return themeVariant === "light" ? "day" : "trading-dark";
}

function getMainCandles(chart: ChartInstance): Candle[] {
  const seriesManager = chart.getSeriesManager();
  let candles: Candle[] = [];

  for (const key in seriesManager) {
    const series = seriesManager[key];
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    if (Array.isArray(series.data) && series.data.length > candles.length) {
    // @ts-ignore
      candles = series.data as Candle[];
    }
  }

  return candles;
}

function CryptoTerminalChartHost({
  selectedSymbol,
  symbolLabel,
  timeframeId,
  themeVariant = "dark",
  onPriceTick,
  onCandleCount,
  onLoadingChange,
  onError,
  onChartReady,
  onChartClickPrice,
  compareSymbol = null,
  compareLabel,
}: CryptoTerminalChartHostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<BinanceAdapter | null>(null);
  const sceneChartRef = useRef<ChartInstance | null>(null);
  const overlaySymbolRef = useRef<string | null>(null);
  const loadGenerationRef = useRef(0);
  const onPriceTickRef = useRef(onPriceTick);
  const onChartReadyRef = useRef(onChartReady);
  const onChartClickPriceRef = useRef(onChartClickPrice);

  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<{
    chart: ChartInstance | null;
    children: ReactNode;
    theme?: ChartUITheme;
  }> | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeTimeframe = TIMEFRAMES.find((tf) => tf.id === timeframeId) ?? TIMEFRAMES[1];
  const chartPresetId = getChartPresetId(themeVariant);
  const chartPreset = useMemo(
    () => themePresets.find((preset) => preset.id === chartPresetId)!,
    [chartPresetId],
  );
  const runtimeTheme = useMemo(() => buildChartTheme(chartPreset.chart), [chartPreset]);
  const chartUiTheme = useMemo(
    () => buildChartSettingsPresetUiTheme(chartPresetId),
    [chartPresetId],
  );
  const overlayLineColor = COMPARE_OVERLAY_COLOR;

  const chartCanvas = useMemo(
    () => <div ref={containerRef} className={styles.chartCanvas} />,
    [],
  );

  onPriceTickRef.current = onPriceTick;
  onChartReadyRef.current = onChartReady;
  onChartClickPriceRef.current = onChartClickPrice;

  useEffect(() => {
    onLoadingChange(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onError(error);
  }, [error, onError]);

  useEffect(() => {
    let disposed = false;

    loadChartUI()
      .then((ChartUI) => {
        if (!disposed) {
          setChartUIComponent(() => ChartUI as ComponentType<{
            chart: ChartInstance | null;
            children: ReactNode;
            theme?: ChartUITheme;
          }>);
        }
      })
      .catch((nextError: unknown) => {
        if (!disposed) {
          const message =
            nextError instanceof Error ? nextError.message : "Could not load ChartUI";
          setError(message);
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ChartUIComponent || chartRef.current) {
      return undefined;
    }

    let disposed = false;
    const initialPresetId = getChartPresetId(themeVariant);
    const initialTheme = buildChartTheme(
      themePresets.find((preset) => preset.id === initialPresetId)!.chart,
    );

    const initChart = async () => {
      setLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        adapterRef.current = new BinanceAdapter();

        const instance = chartModule.createChart({
          container,
          instrument: {
            symbol: "BTCUSDT",
            description: "BTC/USDT",
          },
          theme: initialTheme,
          themeVariant,
          dataAdapter: adapterRef.current,
        });

        chartRef.current = instance;
        instance.init();
        instance.setMainDrawMode("OHLC");
        applyChartSettingsPreset(instance, initialPresetId);
        activatePointer(instance);

        if (!disposed) {
          setChart(instance);
          onChartReadyRef.current?.(instance);
          setChartReady(true);
        }
      } catch (nextError) {
        if (!disposed) {
          setError(nextError instanceof Error ? nextError.message : "Failed to initialize chart");
          setLoading(false);
        }
      }
    };

    void initChart();

    return () => {
      disposed = true;
      sceneChartRef.current = null;
      chartRef.current?.unsubscribeFromUpdates?.();
      chartRef.current?.destroy?.();
      chartRef.current = null;
      adapterRef.current?.disconnect?.();
      adapterRef.current = null;
      overlaySymbolRef.current = null;
      setChart(null);
      onChartReadyRef.current?.(null);
      setChartReady(false);
    };
  }, [ChartUIComponent]);

  useEffect(() => {
    const instance = chartRef.current;
    if (!chartReady || !instance) {
      return;
    }

    applyChartSettingsPreset(instance, chartPresetId);
    instance.applyChartTheme(runtimeTheme, themeVariant);
    instance.render();
  }, [chartPresetId, chartReady, runtimeTheme, themeVariant]);

  useEffect(() => {
    if (!chartReady || !chartRef.current) {
      return undefined;
    }

    const generation = ++loadGenerationRef.current;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const instance = chartRef.current;
        if (!instance || generation !== loadGenerationRef.current) {
          return;
        }

        instance.setInstrument({
          symbol: selectedSymbol,
          description: symbolLabel,
          tradable: true,
        });

        await instance.loadData(selectedSymbol, {
          interval: activeTimeframe.interval,
          limit: 1000,
        });

        if (generation !== loadGenerationRef.current) {
          return;
        }

        const candles = getMainCandles(instance);
        onCandleCount(candles.length);

        if (sceneChartRef.current !== instance) {
          sceneChartRef.current = instance;
          await applyCryptoTerminalScene(instance, candles.length > 0 ? candles : []);
        }

        if (generation !== loadGenerationRef.current) {
          return;
        }

        instance.unsubscribeFromUpdates();
        instance.subscribeToUpdates(selectedSymbol, (update) => {
          const price = update.price ?? update.c ?? 0;
          const timestamp = update.stamp ?? Date.now();
          onPriceTickRef.current(price, timestamp);
        });

        if (adapterRef.current?.getCurrentPrice) {
          try {
            const latest = await adapterRef.current.getCurrentPrice(selectedSymbol);
            onPriceTickRef.current(latest.price ?? latest.c ?? 0, latest.stamp ?? Date.now());
          } catch {
            // ignore
          }
        } else if (candles.length > 0) {
          const last = candles[candles.length - 1]!;
          onPriceTickRef.current(last.c, last.stamp);
        }

        activatePointer(instance);

        if (generation === loadGenerationRef.current) {
          setLoading(false);
        }
      } catch (nextError) {
        if (generation === loadGenerationRef.current) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load market data");
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      if (generation === loadGenerationRef.current) {
        loadGenerationRef.current += 1;
      }
    };
  }, [activeTimeframe.interval, chartReady, onCandleCount, selectedSymbol, symbolLabel]);

  useEffect(() => {
    const instance = chartRef.current;
    if (!chartReady || !instance || loading) {
      return undefined;
    }

    let disposed = false;
    const previousOverlay = overlaySymbolRef.current;

    const syncOverlay = async () => {
      if (previousOverlay && previousOverlay !== compareSymbol) {
        removeChartOverlay(instance, previousOverlay);
      }

      if (!compareSymbol || compareSymbol === selectedSymbol) {
        if (previousOverlay) {
          removeChartOverlay(instance, previousOverlay);
        }
        overlaySymbolRef.current = null;
        return;
      }

      try {
        await applyChartOverlay(
          instance,
          compareSymbol,
          compareLabel ?? compareSymbol,
          activeTimeframe.interval,
          overlayLineColor,
        );
        if (!disposed) {
          overlaySymbolRef.current = compareSymbol;
        }
      } catch {
        // overlay is optional — main chart stays usable
      }
    };

    void syncOverlay();

    return () => {
      disposed = true;
    };
  }, [
    activeTimeframe.interval,
    chartReady,
    compareLabel,
    compareSymbol,
    loading,
    selectedSymbol,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const instance = chartRef.current;
    if (!container || !instance || !chartReady) {
      return undefined;
    }

    const DRAG_THRESHOLD_PX = 5;
    let pointerGesture: { startX: number; startY: number; dragged: boolean } | null = null;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      pointerGesture = {
        startX: event.clientX,
        startY: event.clientY,
        dragged: false,
      };
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerGesture || pointerGesture.dragged) {
        return;
      }

      const dx = event.clientX - pointerGesture.startX;
      const dy = event.clientY - pointerGesture.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        pointerGesture.dragged = true;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }

      const dragged = pointerGesture?.dragged ?? false;
      pointerGesture = null;

      if (dragged || shouldIgnoreChartClickForOrderPrice(instance)) {
        return;
      }

      const price = resolveChartClickPrice(instance, container, event);
      if (price !== null) {
        onChartClickPriceRef.current?.(price);
      }
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("click", onClick);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("click", onClick);
    };
  }, [chartReady, selectedSymbol]);

  const ChartUI = ChartUIComponent;

    // @ts-ignore
  return (
    <div className={styles.chartFrame} data-tour="chart">
    // @ts-ignore
      {loading ? <div className={styles.chartLoading}>Loading market data…</div> : null}
      {error ? <div className={styles.chartError}>{error}</div> : null}
      {ChartUI ? (
    // @ts-ignore
        <ChartUI chart={chart} theme={chartUiTheme ?? undefined}>
          {chartCanvas}
        </ChartUI>
      ) : (
        chartCanvas
      )}
    </div>
  );
}

export default memo(CryptoTerminalChartHost);
