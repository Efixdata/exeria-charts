import type { ArbSignalRecord, Candle, ChartInstance } from "@efixdata/exeria-chart";
import { docsInterval, docsExampleDatasets } from "@site/src/components/chartExampleData";
const previewCandles = docsExampleDatasets.trend.candles;
import { getStarterProjectScene } from "@site/src/data/starterProjectScenes";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { removeChartOverlay } from "../CryptoTerminalApp/chartCompareOverlay";
import { applyChartSettingsPreset } from "../themeCreator/applyChartSettingsPreset";
import { previewInstrument } from "../themeCreator/core";
import { applyArbSignalScene } from "../ForexOpportunityApp/applyArbSignalScene";
import arbSignalsFeed from "../ForexOpportunityApp/data/arb-signals-feed.json";
import { clearAllForexOverlays, clearTriangularArbOverlay } from "../ForexOpportunityApp/forexArbOverlay";
import { clearForexChartScripts } from "../ForexOpportunityApp/forexChartReload";
import {
  findForexPair,
  toChartInterval,
  type ForexTimeframeId,
} from "../ForexOpportunityApp/forexInstruments";
import { loadStaticForexCandles } from "../ForexOpportunityApp/forexStaticData";
import { loadInstrumentNewsFeed } from "../ForexOpportunityApp/newsFeedLoader";
import { setupCompareChart } from "../MarketNewsApp/compareChartSetup";
import { setupNewsChart } from "../MarketNewsApp/newsChartSetup";
import { getMarketNewsChartTheme } from "../MarketNewsApp/marketNewsTheme";
import { applyQuantPreset } from "../QuantAnalyticsApp/applyQuantPreset";
import { clearQuantChartScripts } from "../QuantAnalyticsApp/clearQuantScripts";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import {
  getScriptClone,
  getSeriesReference,
} from "../SignalTerminalApp/scriptSceneUtils";
import {
  alignChartViewportToEnd,
  setupFintechCompareChart,
  type FintechDataContext,
} from "../FintechWealthApp/fintechCompareChartSetup";
import { getMarketPreset } from "../FintechWealthApp/marketPresets";

const STATIC_CANDLE_LIMIT = 1000;

const DEFAULT_PLAYGROUND_LAYOUT = {
  timeAxisHeight: 24,
  endMargin: 100,
  minTimeTickWidth: 108,
} as const;

type PlaygroundChartPanelObject = {
  type?: string;
  dataLink?: string;
  renderAs?: string;
  lineFillVisible?: boolean;
  lineFillMode?: string;
  renderLegend?: boolean;
  hidden?: boolean;
  [key: string]: unknown;
};

type PlaygroundChartRuntime = ChartInstance & {
  model: {
    mainSeries: string;
    timeAxisHeight?: number;
    endMargin?: number;
    minTimeTickWidth?: number;
    minValueTickHeight?: number;
    _priceAxisExpanded?: boolean;
    instrumentsSeries: Array<{ seriesId: string }>;
    panels: Array<{
      main?: boolean;
      hGrid?: boolean;
      vGrid?: boolean;
      basis?: number;
      _visible?: boolean;
      zeroLine?: { color: string; width: number; dash: number[] };
      objects: PlaygroundChartPanelObject[];
    }>;
  };
};

function resetPlaygroundChartLayout(chart: ChartInstance): void {
  const runtime = chart as PlaygroundChartRuntime;
  const mainSeriesId = runtime.model.mainSeries;

  runtime.model.timeAxisHeight = DEFAULT_PLAYGROUND_LAYOUT.timeAxisHeight;
  runtime.model.endMargin = DEFAULT_PLAYGROUND_LAYOUT.endMargin;
  runtime.model.minTimeTickWidth = DEFAULT_PLAYGROUND_LAYOUT.minTimeTickWidth;
  delete runtime.model.minValueTickHeight;
  delete runtime.model._priceAxisExpanded;

  runtime.model.instrumentsSeries = runtime.model.instrumentsSeries.filter(
    (entry) => entry.seriesId === mainSeriesId,
  );

  const seriesManager = chart.getSeriesManager();
  for (const key of Object.keys(seriesManager)) {
    if (key !== mainSeriesId) {
      delete seriesManager[key];
    }
  }

  for (const panel of runtime.model.panels) {
    if (!panel.main) {
      panel._visible = false;
      panel.basis = 0;
      continue;
    }

    panel.hGrid = true;
    panel.vGrid = true;
    panel._visible = true;
    panel.basis = 75;
    delete panel.zeroLine;

    panel.objects = panel.objects.filter(
      (object) => object.type !== "SeriesObject" || object.dataLink === mainSeriesId,
    );

    for (const object of panel.objects) {
      if (object.type !== "SeriesObject" || object.dataLink !== mainSeriesId) {
        continue;
      }

      object.renderAs = "OHLC";
      object.hidden = false;
      delete object.lineFillVisible;
      delete object.lineFillMode;
      delete object.renderLegend;
    }
  }

  chart.setMainDrawMode("OHLC");
  chart.setValueAxisMode("lin");
  chart.setAutoScale(true);
  chart.render();
}

function getArbSignal(signalId: string): ArbSignalRecord {
  const signal = arbSignalsFeed.signals.find((entry) => entry.id === signalId);
  if (!signal) {
    throw new Error(`Missing playground arb signal: ${signalId}`);
  }

  return signal as ArbSignalRecord;
}

async function removeAllScripts(chart: ChartInstance): Promise<void> {
  await clearQuantChartScripts(chart);
  await clearForexChartScripts(chart);

  const strategies = chart.getChartStrategySettings?.() ?? [];
  for (const strategy of strategies) {
    chart.removeChartStrategy?.(strategy.scriptId);
  }

  let indicators: ReturnType<ChartInstance["getChartIndicatorSettings"]> = [];
  try {
    indicators = chart.getChartIndicatorSettings();
  } catch {
    // Chart model may be mid-reset while panels are being pruned.
  }

  for (const indicator of indicators) {
    chart.removeChartIndicator(indicator.scriptId);
  }

  pruneEmptyPanels(chart);
}

export async function resetPlaygroundChart(chart: ChartInstance): Promise<void> {
  clearTriangularArbOverlay(chart);
  clearAllForexOverlays(chart);

  for (const symbol of ["BTCUSD", "BTC/USD", "EURUSD", "EUR/USD", "GBP/USD", "EUR/GBP"]) {
    removeChartOverlay(chart, symbol);
  }

  await removeAllScripts(chart);
  resetPlaygroundChartLayout(chart);
}

async function loadForexSeries(
  chart: ChartInstance,
  symbol: string,
  timeframeId: ForexTimeframeId,
): Promise<Candle[]> {
  const pair = findForexPair(symbol);
  const candles = await loadStaticForexCandles(symbol, timeframeId, STATIC_CANDLE_LIMIT);

  chart.setInstrument({
    id: pair.id,
    symbol: pair.id,
    name: pair.label,
    description: pair.label,
    precision: pair.priceDecimals,
    chart: "ohlc",
    tradable: false,
    keyWords: [pair.id],
    related: [],
  });

  await chart.setMainSeriesData(candles, toChartInterval(timeframeId), false);
  return candles;
}

async function loadBtcSeries(chart: ChartInstance): Promise<Candle[]> {
  chart.setInstrument(previewInstrument);
  await chart.setMainSeriesData(previewCandles, docsInterval, false);
  return previewCandles;
}

/** Plain BTC/USD candles — default playground chart before any example is picked. */
export async function applyDefaultBtcScene(chart: ChartInstance, presetId: string): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, presetId);
  await loadBtcSeries(chart);
  chart.setMainDrawMode("OHLC");
  chart.setValueAxisMode("lin");
  chart.setAutoScale(true);
  alignPlaygroundChartToEnd(chart);
}

/** Pin the latest bar to the right edge using the chart library viewport API. */
export function alignPlaygroundChartToEnd(chart: ChartInstance): void {
  chart.fit();
  chart.moveToEnd?.({ rerender: true });
}

async function applyArbSignalSceneById(
  chart: ChartInstance,
  signalId: string,
): Promise<void> {
  const signal = getArbSignal(signalId);
  const timeframeId = signal.chartScene.timeframe as ForexTimeframeId;
  const candles = await loadForexSeries(chart, signal.chartScene.instrument, timeframeId);
  await applyArbSignalScene(chart, signal, candles, { shouldFocusViewport: false });
  alignPlaygroundChartToEnd(chart);
}

async function wireEquityToCross(chart: ChartInstance): Promise<void> {
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  const equity = getScriptClone(chart, "EQUITY");
  if (equity && equity.inputs) {
    if (equity.inputs.STRATEGY) equity.inputs.STRATEGY.value = getSeriesReference(chart, "CrossValue");
    if (equity.inputs.PRICE) equity.inputs.PRICE.value = getSeriesReference(chart, "c");
    if (equity.inputs.SPREAD) equity.inputs.SPREAD.value = 0;
    if (equity.inputs.COMMISION) equity.inputs.COMMISION.value = 0;
    if (equity.inputs.INITEQ) equity.inputs.INITEQ.value = 0;
    if (equity.inputs.LOTSIZE) equity.inputs.LOTSIZE.value = 100_000;
  }
  await chart.addScript("EQUITY", equity);
}

function setStrategyVisibility(chart: ChartInstance, key: string, visible: boolean): void {
  const strategies = chart.getChartStrategySettings?.() ?? [];
  for (const strategy of strategies) {
    if (strategy.key === key) {
      chart.setChartStrategyVisibility(strategy.scriptId, visible);
    }
  }
}

/** Candlestick chart with SMA cross signals and equity pane. */
export async function applyFxSignalLineScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "carbon");

  await loadForexSeries(chart, "EUR/USD", "m15");

  chart.setMainDrawMode("OHLC");
  chart.setValueAxisMode("lin");
  chart.setAutoScale(true);

  const sma = getScriptClone(chart, "SMA");
  if (sma?.inputs?.PERIODS) sma.inputs.PERIODS.value = 14;
  await chart.addScript("SMA", sma);

  const cross = getScriptClone(chart, "CROSS");
  if (cross?.inputs) {
    if (cross.inputs.LINE) cross.inputs.LINE.value = getSeriesReference(chart, "c");
    if (cross.inputs.SIGNAL) cross.inputs.SIGNAL.value = getSeriesReference(chart, "SMAValue");
    if (cross.inputs.ONDN) cross.inputs.ONDN.value = "Sell";
    if (cross.inputs.ONUP) cross.inputs.ONUP.value = "Buy";
  }
  await chart.addScript("CROSS", cross);

  setStrategyVisibility(chart, "CROSS", true);
  await wireEquityToCross(chart);

  pruneEmptyPanels(chart);
  ensureChartPointerMode(chart);
  await chart.recalculateScripts?.({ rerender: true });
  alignPlaygroundChartToEnd(chart);
}

/** Light editorial compare — EUR/USD vs GBP/USD indexed to %. */
export async function applyMarketCompareDuoScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "onyx");

  const theme = getMarketNewsChartTheme("light");
  await setupCompareChart(chart, "1m", theme);
  ensureChartPointerMode(chart);
  alignPlaygroundChartToEnd(chart);
}

/** Quant WMA / EMA composite with equity pane. */
export async function applyQuantCompositeScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "midnight");
  await loadForexSeries(chart, "EUR/USD", "h1");
  await applyQuantPreset(chart, "macdCrossover");
  alignPlaygroundChartToEnd(chart);
}

/** Dark news markers with RSI sub-pane. */
export async function applyNewsRsiScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "carbon");

  const theme = getMarketNewsChartTheme("dark");
  const records = await loadInstrumentNewsFeed("EUR/USD", { limit: 12 });
  await setupNewsChart(chart, records, theme, "1m");

  const rsi = structuredClone(chart.getScripts().RSI);
  if (rsi) {
    rsi.pane = "new";
    await chart.addScript("RSI", rsi);
  }

  await chart.recalculateScripts?.({ rerender: true });
  alignPlaygroundChartToEnd(chart);
}

/** Three-way FX compare — EUR/USD, GBP/USD, EUR/GBP on one %. */
export async function applyMarketCompareTrioScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "onyx");
  await applyArbSignalSceneById(chart, "arb-triangular");
}

/** Bollinger breakout with equity curve. */
export async function applyQuantBollingerScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "midnight");
  await loadForexSeries(chart, "EUR/USD", "h1");
  await applyQuantPreset(chart, "bollingerBreakout");
  alignPlaygroundChartToEnd(chart);
}

/** Dark consumer portfolio compare — three indexed crypto lines. */
export async function applyFintechCompareScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "trading-dark");

  const preset = getMarketPreset("crypto");
  const context: FintechDataContext = {
    marketId: "crypto",
    periodId: "1m",
    interval: "1d",
    limit: 280,
  };

  await setupFintechCompareChart(chart, preset.assets, context, null, "dark");
  ensureChartPointerMode(chart);
  alignChartViewportToEnd(chart);
}

/** Crypto terminal — same chart setup as /starters/crypto-terminal demo. */
export async function applyPlaygroundCryptoTerminalScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);

  const scene = getStarterProjectScene("crypto-terminal");

  chart.setInstrument(previewInstrument);
  await chart.setMainSeriesData(scene.candles, docsInterval, false);

  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  if (scene.applyScene) {
    await scene.applyScene(chart, scene.candles);
  }

  chart.fit();
  chart.moveToEnd?.({ rerender: true });
}

/** Mean-reversion desk — Bollinger rebound with equity pane. */
export async function applyQuantReversionScene(chart: ChartInstance): Promise<void> {
  await resetPlaygroundChart(chart);
  applyChartSettingsPreset(chart, "paper");
  await loadForexSeries(chart, "EUR/USD", "h1");
  await applyQuantPreset(chart, "meanReversion");
  alignPlaygroundChartToEnd(chart);
}

export type PlaygroundSceneId =
  | "fx-signal-line"
  | "market-compare-duo"
  | "quant-composite"
  | "news-rsi"
  | "market-compare-trio"
  | "quant-bollinger"
  | "fintech-compare"
  | "crypto-terminal"
  | "quant-reversion";

export const playgroundSceneApplyHandlers: Record<
  PlaygroundSceneId,
  (chart: ChartInstance) => Promise<void>
> = {
  "fx-signal-line": applyFxSignalLineScene,
  "market-compare-duo": applyMarketCompareDuoScene,
  "quant-composite": applyQuantCompositeScene,
  "news-rsi": applyNewsRsiScene,
  "market-compare-trio": applyMarketCompareTrioScene,
  "quant-bollinger": applyQuantBollingerScene,
  "fintech-compare": applyFintechCompareScene,
  "crypto-terminal": applyPlaygroundCryptoTerminalScene,
  "quant-reversion": applyQuantReversionScene,
};
