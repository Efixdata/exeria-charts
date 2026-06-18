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
import { buildChartTheme } from "../themeCreator/core";
import {
  disableChartPanInteraction,
  enableChartPanInteraction,
  ensureChartPointerMode,
} from "./chartPanInteraction";
import { SCREENER_CHART_PRESET_ID, type TimeframeId } from "./constants";
import { applySignalTerminalScene } from "./chartScene";
import styles from "./signalTerminalApp.module.css";

type SignalTerminalChartHostProps = {
  selectedSymbol: string;
  symbolLabel: string;
  timeframeId: TimeframeId;
  onPriceTick: (price: number, timestamp: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onError: (message: string | null) => void;
  onChartReady?: (chart: ChartInstance | null) => void;
};

function getMainCandles(chart: ChartInstance): Candle[] {
  const seriesManager = chart.getSeriesManager();
  let candles: Candle[] = [];

  for (const key in seriesManager) {
    const series = seriesManager[key];
    if (series && Array.isArray(series.data) && series.data.length > candles.length) {
      candles = series.data as Candle[];
    }
  }

  return candles;
}

function SignalTerminalChartHost({
  selectedSymbol,
  symbolLabel,
  timeframeId,
  onPriceTick,
  onLoadingChange,
  onError,
  onChartReady,
}: SignalTerminalChartHostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<BinanceAdapter | null>(null);
  const sceneChartRef = useRef<ChartInstance | null>(null);
  const loadGenerationRef = useRef(0);
  const onPriceTickRef = useRef(onPriceTick);
  const onChartReadyRef = useRef(onChartReady);

  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<{
    chart: ChartInstance | null;
    children: ReactNode;
    theme?: ChartUITheme | undefined;
  }> | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chartPresetId = SCREENER_CHART_PRESET_ID;
  const chartPreset = useMemo(
    () => themePresets.find((preset) => preset.id === chartPresetId)!,
    [],
  );
  const runtimeTheme = useMemo(() => buildChartTheme(chartPreset.chart), [chartPreset]);
  const chartUiTheme = useMemo(() => buildChartSettingsPresetUiTheme(chartPresetId), []);

  const chartCanvas = useMemo(
    () => <div ref={containerRef} className={styles.chartCanvas} />,
    [],
  );

  onPriceTickRef.current = onPriceTick;
  onChartReadyRef.current = onChartReady;

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
            theme?: ChartUITheme | undefined;
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
    const initialTheme = buildChartTheme(chartPreset.chart);

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
          themeVariant: "dark",
          dataAdapter: adapterRef.current,
        });

        chartRef.current = instance;
        instance.init();
        instance.setMainDrawMode("OHLC");
        applyChartSettingsPreset(instance, chartPresetId);
        ensureChartPointerMode(instance);
        enableChartPanInteraction(instance, container);

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
      if (chartRef.current) {
        disableChartPanInteraction(chartRef.current);
      }
      chartRef.current?.destroy?.();
      chartRef.current = null;
      adapterRef.current?.disconnect?.();
      adapterRef.current = null;
      setChart(null);
      onChartReadyRef.current?.(null);
      setChartReady(false);
    };
  }, [ChartUIComponent, chartPreset.chart]);

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
          interval: "1h",
          limit: 1000,
        });

        if (generation !== loadGenerationRef.current) {
          return;
        }

        if (sceneChartRef.current !== instance) {
          sceneChartRef.current = instance;
          await applySignalTerminalScene(instance, selectedSymbol);
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

        const candles = getMainCandles(instance);
        if (adapterRef.current?.getCurrentPrice) {
          try {
            const latest = await adapterRef.current.getCurrentPrice(selectedSymbol);
            onPriceTickRef.current(latest.price ?? latest.c ?? 0, latest.stamp ?? Date.now());
          } catch {
            if (candles.length > 0) {
              const last = candles[candles.length - 1]!;
              onPriceTickRef.current(last.c, last.stamp);
            }
          }
        } else if (candles.length > 0) {
          const last = candles[candles.length - 1]!;
          onPriceTickRef.current(last.c, last.stamp);
        }

        ensureChartPointerMode(instance);

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
  }, [chartReady, selectedSymbol, symbolLabel]);

  const ChartUI = ChartUIComponent;

  return (
    <div className={styles.chartFrame}>
      {loading ? <div className={styles.chartLoading}>Loading market data…</div> : null}
      {error ? <div className={styles.chartError}>{error}</div> : null}
      {ChartUI ? (
        <ChartUI chart={chart} {...(chartUiTheme ? { theme: chartUiTheme } : {})}>
          {chartCanvas}
        </ChartUI>
      ) : (
        chartCanvas
      )}
    </div>
  );
}

export default memo(SignalTerminalChartHost);
