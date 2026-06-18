"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
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
} from "../SignalTerminalApp/chartPanInteraction";
import { scrollChartToEnd } from "../ForexOpportunityApp/chartBarPosition";
import { clearForexChartScripts } from "../ForexOpportunityApp/forexChartReload";
import {
  findForexPair,
  findForexTimeframe,
  toChartInterval,
  type ForexTimeframeId,
} from "../ForexOpportunityApp/forexInstruments";
import { ForexStaticDataAdapter } from "../ForexOpportunityApp/forexStaticDataAdapter";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import { clearQuantChartScripts } from "./clearQuantScripts";
import {
  getQuantChartPresetId,
  type QuantAppTheme,
} from "./constants";
import styles from "./quantAnalyticsApp.module.css";

export type QuantChartHostMeta = {
  adapter: ForexStaticDataAdapter | null;
  candles: Candle[];
};

type QuantChartHostProps = {
  symbol: string;
  timeframeId: ForexTimeframeId;
  themeVariant?: QuantAppTheme;
  onChartReady?: (chart: ChartInstance | null, meta?: QuantChartHostMeta) => void;
  onCandlesLoaded?: (candles: Candle[], meta: QuantChartHostMeta) => void;
  onLoadingChange?: (loading: boolean) => void;
  onError?: (message: string | null) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
};

const STATIC_CANDLE_LIMIT = 1000;

function QuantChartHost({
  symbol,
  timeframeId,
  themeVariant = "dark",
  onChartReady,
  onCandlesLoaded,
  onLoadingChange,
  onError,
  containerRef: externalContainerRef,
}: QuantChartHostProps) {
  const internalContainerRef = useRef<HTMLDivElement | null>(null);
  const containerRef = externalContainerRef ?? internalContainerRef;
  const chartRef = useRef<ChartInstance | null>(null);
  const adapterRef = useRef<ForexStaticDataAdapter | null>(null);
  const loadGenerationRef = useRef(0);
  const onChartReadyRef = useRef(onChartReady);
  const onCandlesLoadedRef = useRef(onCandlesLoaded);

  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [ChartUIComponent, setChartUIComponent] = useState<ComponentType<{
    chart: ChartInstance | null;
    children: ReactNode;
    theme?: ChartUITheme;
  }> | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pairMeta = useMemo(() => findForexPair(symbol), [symbol]);
  const timeframe = useMemo(() => findForexTimeframe(timeframeId), [timeframeId]);

  const chartPresetId = getQuantChartPresetId(themeVariant);
  const chartPreset = useMemo(
    () => themePresets.find((preset) => preset.id === chartPresetId)!,
    [chartPresetId],
  );
  const runtimeTheme = useMemo(() => buildChartTheme(chartPreset.chart), [chartPreset]);
  const chartUiTheme = useMemo(
    () => buildChartSettingsPresetUiTheme(chartPresetId),
    [chartPresetId],
  );

  onChartReadyRef.current = onChartReady;
  onCandlesLoadedRef.current = onCandlesLoaded;

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    onError?.(error);
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
          setError(nextError instanceof Error ? nextError.message : "Could not load ChartUI");
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

    const initChart = async () => {
      setLoading(true);
      setError(null);

      try {
        const chartModule = await import("@efixdata/exeria-chart");
        if (disposed) {
          return;
        }

        adapterRef.current = new ForexStaticDataAdapter();

        const instance = chartModule.createChart({
          container,
          instrument: {
            symbol: pairMeta.id,
            description: pairMeta.label,
            tradable: true,
          },
          theme: runtimeTheme,
          themeVariant,
          dataAdapter: adapterRef.current,
        });

        chartRef.current = instance;
        instance.init();
        applyChartSettingsPreset(instance, chartPresetId);
        ensureChartPointerMode(instance);
        enableChartPanInteraction(instance, container);

        if (!disposed) {
          setChart(instance);
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
      if (chartRef.current) {
        disableChartPanInteraction(chartRef.current);
      }
      chartRef.current?.unsubscribeFromUpdates?.();
      void adapterRef.current?.disconnect?.();
      chartRef.current?.destroy?.();
      chartRef.current = null;
      adapterRef.current = null;
      setChart(null);
      setChartReady(false);
      onChartReadyRef.current?.(null);
    };
  }, [ChartUIComponent, containerRef]);

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

    const isCurrentLoad = () => generation === loadGenerationRef.current;

    const loadMarket = async () => {
      setLoading(true);
      setError(null);

      const instance = chartRef.current;
      if (!instance) {
        setLoading(false);
        return;
      }

      try {
        instance.setInstrument({
          symbol: pairMeta.id,
          description: pairMeta.label,
          tradable: true,
        });

        instance.unsubscribeFromUpdates?.();

        const adapter = adapterRef.current ?? new ForexStaticDataAdapter();
        adapterRef.current = adapter;
        await adapter.initialize({});

        if (!isCurrentLoad()) {
          return;
        }

        await clearQuantChartScripts(instance);
        await clearForexChartScripts(instance);

        if (!isCurrentLoad()) {
          return;
        }

        const candles = await loadStaticForexCandles(
          pairMeta.id,
          timeframeId,
          STATIC_CANDLE_LIMIT,
        );

        if (!isCurrentLoad()) {
          return;
        }

        await instance.setMainSeriesData(candles, toChartInterval(timeframeId), false);

        if (!isCurrentLoad()) {
          return;
        }

        await instance.recalculateScripts?.({ rerender: true });
        scrollChartToEnd(instance);

        const meta: QuantChartHostMeta = {
          adapter: adapterRef.current,
          candles,
        };

        onChartReadyRef.current?.(instance, meta);
        onCandlesLoadedRef.current?.(candles, meta);
      } catch (nextError) {
        if (!isCurrentLoad()) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Failed to load market data");
      } finally {
        if (isCurrentLoad()) {
          setLoading(false);
        }
      }
    };

    void loadMarket();

    return () => {
      if (generation === loadGenerationRef.current) {
        loadGenerationRef.current += 1;
      }
    };
  }, [chartReady, pairMeta.id, pairMeta.label, symbol, timeframe.interval, timeframeId]);

  const ChartUI = ChartUIComponent;

  return (
    <div className={styles.chartFrame}>
      {loading ? (
        <div className={styles.chartLoading}>
          Loading {pairMeta.buttonLabel} {timeframe.label}…
        </div>
      ) : null}
      {error ? <div className={styles.chartError}>{error}</div> : null}
      {ChartUI ? (
        <ChartUI chart={chart} theme={chartUiTheme ?? undefined}>
          <div ref={containerRef} className={styles.chartCanvas} />
        </ChartUI>
      ) : (
        <div ref={containerRef} className={styles.chartCanvas} />
      )}
    </div>
  );
}

export default memo(QuantChartHost);
