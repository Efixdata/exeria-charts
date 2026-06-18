import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChartUI, type ChartUIMobileLayout } from "@efixdata/exeria-chart-ui-react";
import Chart from "@efixdata/exeria-chart";
import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import {
  AVAILABLE_DRAW_MODES,
  buildInstrument,
  getIntervalFixture,
  getPresetById,
  reviewPresets,
  type ReviewPreset,
  type IntervalFixture,
} from "./chartReviewPresets";
import { chartReviewThemes, reviewUiThemes } from "./chartReviewThemes";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

interface ViewState {
  presetId: string;
  intervalSymbol: string;
}

function formatDate(stamp: number): string {
  return dateFormatter.format(new Date(stamp));
}

function drawReviewOverlays(
  chart: ChartInstance,
  candles: Candle[],
  intervalMs: number,
  accentColor: string
): void {
  if (!candles?.length || candles.length < 12) {
    return;
  }

  const trendStart = candles[Math.max(2, Math.floor(candles.length * 0.16))];
  const trendEnd = candles[Math.max(6, Math.floor(candles.length * 0.34))];
  const rangeStart = candles[Math.max(10, Math.floor(candles.length * 0.56))];
  const rangeEnd = candles[Math.min(candles.length - 2, Math.floor(candles.length * 0.82))];

  if (!trendStart || !trendEnd || !rangeStart || !rangeEnd) {
    return;
  }

  const timeRange = Math.max(rangeEnd.stamp - rangeStart.stamp, intervalMs * 4);
  const directionIsUp = rangeEnd.c >= rangeStart.c;

  chart.toolDrawer.drawTrendLine({
    startStamp: trendStart.stamp,
    endStamp: trendEnd.stamp,
    startPrice: trendStart.l,
    endPrice: trendEnd.h,
    config: {
      editable: false,
      color: accentColor,
    },
  });

  chart.toolDrawer.drawTimeRange({
    text: "Review range",
    startTime: rangeStart.stamp,
    timeRange,
    config: {
      editable: false,
      color: accentColor,
      secondaryColor: "rgba(255, 255, 255, 0.08)",
      textColor: "#F7FBFF",
    },
  });

  chart.toolDrawer.drawTimeBet({
    startTime: trendEnd.stamp,
    timeRange: Math.max(rangeEnd.stamp - trendEnd.stamp, intervalMs * 3),
    price: trendEnd.c,
    reward: 125,
    bet: 50,
    predictedDirection: directionIsUp ? "UP" : "DOWN",
    status: "ACTIVE",
    isWinning: directionIsUp,
    config: {
      editable: false,
      color: "rgba(12, 18, 33, 0.72)",
      winningColor: "#25AD98",
      losingColor: "#D12E59",
      secondaryColor: "rgba(255, 255, 255, 0.1)",
      textColor: "#F7FBFF",
      priceTag: true,
    },
  });
}

export default function WebChartComponent(_props: Record<string, never>) {
  const initialPreset = reviewPresets[0];
  if (!initialPreset) {
    throw new Error("No review presets configured");
  }

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ChartInstance | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    presetId: initialPreset.id,
    intervalSymbol: initialPreset.defaultIntervalSymbol,
  });
  const [mobilePreview, setMobilePreview] = useState(false);
  const [mobileLayout, setMobileLayout] = useState<ChartUIMobileLayout>("default");

  const activePreset = useMemo<ReviewPreset>(() => getPresetById(viewState.presetId), [viewState.presetId]);
  const activeInterval = useMemo<IntervalFixture>(
    () => getIntervalFixture(activePreset, viewState.intervalSymbol),
    [activePreset, viewState.intervalSymbol]
  );
  const activeRuntimeTheme = chartReviewThemes[activePreset.runtimeThemeId as keyof typeof chartReviewThemes];
  const activeUiTheme = reviewUiThemes[activePreset.uiThemeId as keyof typeof reviewUiThemes];
  const chartUiKey = `${activePreset.id}:${activeInterval.interval.symbol}`;

  const rangeLabel = useMemo(() => {
    const firstCandle = activeInterval.candles[0];
    const lastCandle = activeInterval.candles[activeInterval.candles.length - 1];

    if (!firstCandle || !lastCandle) {
      return "No data";
    }

    return `${formatDate(firstCandle.stamp)} - ${formatDate(lastCandle.stamp)}`;
  }, [activeInterval.candles]);

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) {
      return undefined;
    }

    let disposed = false;
    const chartInstance = new Chart({
      container: containerElement,
      instrument: buildInstrument(activePreset, activeInterval.interval.symbol),
      theme: activeRuntimeTheme,
      themeVariant: activePreset.themeVariant,
    }) as unknown as ChartInstance;

    containerElement.style.width = "100%";
    containerElement.style.height = "100%";
    containerElement.style.maxHeight = "100%";
    containerElement.style.maxWidth = "100%";
    containerElement.style.position = "relative";

    setChart(null);

    const setupChart = async (): Promise<void> => {
      chartInstance.init();
      await chartInstance.setMainSeriesData(activeInterval.candles, activeInterval.interval);

      if (disposed) {
        chartInstance.destroy();
        return;
      }

      drawReviewOverlays(
        chartInstance,
        activeInterval.candles,
        activeInterval.interval.milis,
        activePreset.overlayAccent
      );

      setChart(chartInstance);
    };

    setupChart().catch((error: unknown) => {
      console.error("Failed to initialize review chart", error);
      if (!disposed) {
        setChart(null);
      }
    });

    return () => {
      disposed = true;
      setChart((currentChart: ChartInstance | null) =>
        currentChart === chartInstance ? null : currentChart
      );
      chartInstance.destroy();
    };
  }, [activeInterval, activePreset, activeRuntimeTheme]);

  const handlePresetSelect = (presetId: string): void => {
    const nextPreset = getPresetById(presetId);
    setViewState({
      presetId: nextPreset.id,
      intervalSymbol: nextPreset.defaultIntervalSymbol,
    });
  };

  const handleIntervalChange = (symbol: string): void => {
    if (!activePreset.intervalFixtures[symbol]) {
      return;
    }

    setViewState((currentViewState: ViewState) => {
      if (currentViewState.intervalSymbol === symbol) {
        return currentViewState;
      }

      return {
        ...currentViewState,
        intervalSymbol: symbol,
      };
    });
  };

  return (
    <main className="reviewPage">
      <section className="reviewSidebar">
        <div className="reviewPanel reviewHero">
          <p className="reviewEyebrow">Apps/Web Review Surface</p>
          <h1>Theme and chart-type playground</h1>
          <p>
            Example themes and review fixtures now live in the app, not in the published chart
            runtime. Theme swaps recreate the chart instance because the chart color manager is
            global.
          </p>
        </div>

        <div className="reviewPanel">
          <div className="reviewSectionHeader">
            <h2>Theme presets</h2>
            <span>{reviewPresets.length} presets</span>
          </div>
          <div className="presetGrid">
            {reviewPresets.map((preset) => {
              const isActive = preset.id === activePreset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  className={`presetCard${isActive ? " is-active" : ""}`}
                  onClick={() => handlePresetSelect(preset.id)}
                >
                  <span
                    className="presetSwatch"
                    style={{
                      background: `linear-gradient(135deg, ${preset.swatch[0]}, ${preset.swatch[1]})`,
                    }}
                  />
                  <span className="presetLabel">{preset.label}</span>
                  <span className="presetSummary">{preset.summary}</span>
                  <span className="presetMeta">
                    {Object.values(preset.intervalFixtures)
                      .map((fixture: IntervalFixture) => fixture.interval.symbol)
                      .join(" / ")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="reviewPanel">
          <div className="reviewSectionHeader">
            <h2>Review focus</h2>
            <span>Toolbar is live</span>
          </div>
          <ul className="reviewChecklist">
            <li>Use the chart toolbar to switch between all five main draw modes.</li>
            <li>
              Swap presets here to review runtime theme palettes without touching package source.
            </li>
            <li>
              Change interval inside the chart to verify spacing, axis density, and overlay
              contrast.
            </li>
          </ul>
        </div>

        <div className="reviewPanel">
          <div className="reviewSectionHeader">
            <h2>Mobile preview</h2>
            <span>390px frame</span>
          </div>
          <div className="reviewMobileControls">
            <label className="reviewToggle">
              <input
                type="checkbox"
                checked={mobilePreview}
                onChange={(event) => setMobilePreview(event.target.checked)}
              />
              <span>Constrain chart panel to phone width</span>
            </label>
            <label className="reviewToggle">
              <span>ChartUI layout</span>
              <select
                value={mobileLayout}
                onChange={(event) =>
                  setMobileLayout(event.target.value as ChartUIMobileLayout)
                }
              >
                <option value="default">default</option>
                <option value="minimal">minimal</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="reviewStage">
        <div className="reviewPanel reviewStageHeader">
          <div>
            <p className="reviewEyebrow">Active preset</p>
            <h2>{activePreset.label}</h2>
            <p>{activePreset.callout}</p>
          </div>

          <div className="reviewMetrics">
            <div className="reviewMetric">
              <span className="reviewMetricLabel">Instrument</span>
              <strong>{activePreset.instrument.symbol}</strong>
            </div>
            <div className="reviewMetric">
              <span className="reviewMetricLabel">Interval</span>
              <strong>{activeInterval.interval.symbol}</strong>
            </div>
            <div className="reviewMetric">
              <span className="reviewMetricLabel">Candles</span>
              <strong>{activeInterval.candles.length}</strong>
            </div>
            <div className="reviewMetric">
              <span className="reviewMetricLabel">Range</span>
              <strong>{rangeLabel}</strong>
            </div>
          </div>
        </div>

        <div className="reviewPanel reviewModeStrip">
          <div className="reviewSectionHeader">
            <h2>Available chart types</h2>
            <span>Select them from the toolbar</span>
          </div>
          <div className="reviewPills">
            {AVAILABLE_DRAW_MODES.map((mode) => (
              <span key={mode} className="reviewPill">
                {mode}
              </span>
            ))}
          </div>
        </div>

        <div
          className={`reviewPanel reviewChartPanel${mobilePreview ? " reviewChartPanel--mobilePreview" : ""}`}
        >
          <ChartUI
            key={chartUiKey}
            chart={chart}
            mobileLayout={mobileLayout}
            onIntervalChange={handleIntervalChange}
            theme={activeUiTheme}
          >
            <div ref={containerRef} className="reviewChartCanvas" />
          </ChartUI>
        </div>

        <div className="reviewPanel reviewStageFooter">
          <p>
            Overlay examples are injected from <code>apps/web</code> only. The package runtime now
            keeps just live source and the vendored Hammer bundle.
          </p>
        </div>
      </section>
    </main>
  );
}
