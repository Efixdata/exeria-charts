import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import type { FintechAsset, FintechPeriodId } from "./constants";
import {
  buildCanonicalStamps,
  ensureMinimumChartBars,
  loadEquityCandles,
  normalizeCandlesToStamps,
} from "./equityDataLoader";
import { MIN_CHART_BARS } from "./constants";
import { dimColor } from "./fintechColor";
import type { FintechMarketId } from "./marketPresets";

export type FintechThemeVariant = "dark" | "light";

export type FintechDataContext = {
  marketId: FintechMarketId;
  periodId: FintechPeriodId;
  interval: string;
  limit: number;
};

type ChartPanelObject = {
  id?: string;
  type?: string;
  dataLink?: string;
  renderAs?: string;
  color?: string;
  stroke?: number[];
  dash?: number[];
  width?: number;
  priceTag?: boolean;
  priceLine?: boolean;
  lineFillVisible?: boolean;
  lineFillMode?: "solid" | "gradient";
  lineFillGradientOpacity?: number;
  fillGradientColor?: string;
  renderLegend?: boolean;
  strokeStyle?: string;
  [key: string]: unknown;
};

type ChartPanel = {
  main?: boolean;
  hGrid?: boolean;
  vGrid?: boolean;
  basis?: number;
  _visible?: boolean;
  zeroLine?: { color: string; width: number; dash: number[] };
  objects: ChartPanelObject[];
};

const PURCHASE_MARKER_ID = "fintech-purchase-marker";
const FINTECH_VALUE_TICK_HEIGHT = 28;

type ChartRuntime = ChartInstance & {
  model: {
    mainSeries: string;
    timeAxisHeight: number;
    valueAxisWidth: number;
    endMargin: number;
    minTimeTickWidth: number;
    minValueTickHeight: number;
    periodWidth: number;
    viewportLeft: number;
    _width: number;
    _priceAxisExpanded?: boolean;
    panels: ChartPanel[];
    instrumentsSeries: Array<{
      seriesId: string;
      title: string;
      labels: string[];
      fields: string[];
      instrument: Record<string, unknown>;
    }>;
    interval?: unknown;
  };
  fusion: {
    fullSynchronization(): void;
    getMainSeries(): { data: Candle[] };
  };
  renderer?: {
    getPriceRenderingOptions: () => { valueAxisWidth: number };
  };
  moveToEnd?(options?: { rerender?: boolean }): void;
};

function overlaySeriesId(symbol: string): string {
  return `overlay-${symbol}`;
}

function seriesIdForAsset(runtime: ChartRuntime, asset: FintechAsset, index: number): string {
  return index === 0 ? runtime.model.mainSeries : overlaySeriesId(asset.symbol);
}

function createInstrument(
  symbol: string,
  label: string,
  marketId: FintechMarketId,
  instrumentId = symbol,
) {
  const precision =
    marketId === "equities" ? 2 : symbol.startsWith("BTC") ? 2 : symbol.includes("USDT") ? 4 : 6;

  return {
    id: instrumentId,
    symbol,
    name: label,
    description: label,
    precision,
    chart: "ohlc",
    tradable: false,
    keyWords: [symbol, label],
    related: [],
  };
}

function createLinePlotter(seriesId: string, color: string, emphasized = true): ChartPanelObject {
  return {
    id: seriesId,
    type: "SeriesObject",
    dataLink: seriesId,
    renderAs: "Line",
    color,
    stroke: [emphasized ? 2.5 : 1.5],
    dash: [],
    width: emphasized ? 2.5 : 1.5,
    priceTag: false,
    priceLine: false,
    lineFillVisible: true,
    lineFillMode: "gradient",
    fillGradientColor: color,
    lineFillGradientOpacity: emphasized ? 0.28 : 0.12,
    renderLegend: false,
    openDataField: "o",
    highDataField: "h",
    lowDataField: "l",
    closeDataField: "c",
    dataField: "c",
    strokeStyle: color,
    _hit: false,
    _hitAnchor: null,
    _hitArrow: null,
    selected: false,
  };
}

function getMainPanel(runtime: ChartRuntime) {
  return runtime.model.panels.find((panel) => panel.main) ?? runtime.model.panels[0];
}

function hideChartVolume(chart: ChartInstance): void {
  const runtime = chart as ChartRuntime;
  const volume = chart.getChartVolumeSettings();

  if (volume.available) {
    chart.applyChartVolumeSettings({ ...volume, visible: false });
    if (volume.scriptId != null) {
      chart.setChartIndicatorVisibility(volume.scriptId, false);
    }
  }

  for (const panel of runtime.model.panels) {
    if (!panel.main) {
      panel.basis = 0;
      panel._visible = false;
      for (const object of panel.objects) {
        object.hidden = true;
      }
    }
  }
}

function applySeriesPlotterStyle(
  runtime: ChartRuntime,
  seriesId: string,
  color: string,
  options: {
    emphasized?: boolean;
    priceTag?: boolean;
    priceLine?: boolean;
    lineWidth?: number;
    fillOpacity?: number;
  } = {},
): void {
  const mainPanel = getMainPanel(runtime);
  if (!mainPanel) {
    return;
  }

  const emphasized = options.emphasized ?? true;
  const lineWidth = options.lineWidth ?? (emphasized ? 2.5 : 1.5);
  const fillOpacity = options.fillOpacity ?? (emphasized ? 0.28 : 0.12);

  for (const object of mainPanel.objects) {
    if (object.type === "SeriesObject" && object.dataLink === seriesId) {
      object.color = color;
      object.strokeStyle = color;
      object.fillGradientColor = color;
      object.lineFillVisible = true;
      object.lineFillMode = "gradient";
      object.lineFillGradientOpacity = fillOpacity;
      object.stroke = [lineWidth];
      object.width = lineWidth;
      if (options.priceTag !== undefined) {
        object.priceTag = options.priceTag;
      }
      if (options.priceLine !== undefined) {
        object.priceLine = options.priceLine;
      }
    }
  }
}

function removePurchaseMarker(runtime: ChartRuntime): void {
  const mainPanel = getMainPanel(runtime);
  if (!mainPanel) {
    return;
  }

  mainPanel.objects = mainPanel.objects.filter((object) => object.id !== PURCHASE_MARKER_ID);
}

export function clearFintechDrawingTools(chart: ChartInstance): void {
  const runtime = chart as ChartRuntime;
  const mainPanel = getMainPanel(runtime);
  if (!mainPanel) {
    return;
  }

  removePurchaseMarker(runtime);
  mainPanel.objects = mainPanel.objects.filter((object) => object.type === "SeriesObject");
}

function applyPurchaseMarker(chart: ChartInstance, candles: Candle[]): void {
  const runtime = chart as ChartRuntime;
  const mainPanel = getMainPanel(runtime);
  if (!mainPanel || candles.length < 4) {
    return;
  }

  removePurchaseMarker(runtime);

  const buyIndex = Math.max(1, Math.floor(candles.length * 0.58));
  const buyCandle = candles[buyIndex];
  if (!buyCandle) {
    return;
  }

  chart.toolDrawer.drawTool({
    id: PURCHASE_MARKER_ID,
    type: "vLine",
    color: "#22c55e",
    width: 1.5,
    dash: [5, 4],
    editable: false,
    anchors: [
      {
        stamp: buyCandle.stamp,
        offset: 0,
        value: buyCandle.c,
        _index: buyIndex,
      },
    ],
  });
}

export function waitForChartContainerReady(
  container: HTMLElement,
  timeoutMs = 2_000,
): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();

    const tick = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        resolve();
        return;
      }

      if (performance.now() - started >= timeoutMs) {
        resolve();
        return;
      }

      window.requestAnimationFrame(tick);
    };

    tick();
  });
}

export function relayoutFintechChartViewport(chart: ChartInstance): void {
  chart.fit();
  alignChartViewportToEnd(chart);
}

export function scheduleFintechChartRelayout(chart: ChartInstance): void {
  relayoutFintechChartViewport(chart);
  window.requestAnimationFrame(() => relayoutFintechChartViewport(chart));
  window.setTimeout(() => relayoutFintechChartViewport(chart), 320);
}

function chartChromeColors(themeVariant: FintechThemeVariant) {
  if (themeVariant === "light") {
    return {
      background: "#ffffff",
      axisText: "#787b86",
      crosshair: "#d1d4dc",
      zeroLine: "#e0e3eb",
    };
  }

  return {
    background: "#000000",
    axisText: "#727b90",
    crosshair: "#2d3340",
    zeroLine: "#1e2330",
  };
}

function applyFintechChartChrome(chart: ChartInstance, themeVariant: FintechThemeVariant = "dark"): void {
  const runtime = chart as ChartRuntime;
  const appearance = chart.getChartAppearanceSettings();
  const chrome = chartChromeColors(themeVariant);

  chart.applyChartAppearanceSettings({
    ...appearance,
    background: chrome.background,
    gridVisible: false,
    gridMode: "none",
    lastPriceLineVisible: false,
    lastPriceLabelVisible: true,
    chartLineFillVisible: true,
    chartLineFillMode: "gradient",
    axisText: chrome.axisText,
    crosshair: chrome.crosshair,
  });

  runtime.model.timeAxisHeight = 0;
  runtime.model.endMargin = 0;
  runtime.model.minTimeTickWidth = 9999;
  runtime.model.minValueTickHeight = FINTECH_VALUE_TICK_HEIGHT;
  runtime.model._priceAxisExpanded = true;

  hideChartVolume(chart);

  for (const panel of runtime.model.panels) {
    panel.hGrid = false;
    panel.vGrid = false;
    if (panel.main) {
      panel.zeroLine = { color: chrome.zeroLine, width: 1, dash: [] };
    }
  }

  for (const panel of runtime.model.panels) {
    for (const object of panel.objects) {
      object.renderLegend = false;
      if (object.type === "SeriesObject") {
        object.lineFillVisible = true;
        object.lineFillMode = "gradient";
      }
    }
  }

  chart.setAutoScale(true);
  chart.setValueAxisMode("%");
}

export function applyFintechCompareChartTheme(
  chart: ChartInstance,
  theme: Parameters<ChartInstance["applyChartTheme"]>[0],
  themeVariant: FintechThemeVariant,
  assets: FintechAsset[],
  focusedAssetId: string | null,
): void {
  chart.applyChartTheme(theme, themeVariant);
  applyFintechChartChrome(chart, themeVariant);
  applySeriesFocus(chart, assets, focusedAssetId);
  alignChartViewportToEnd(chart);
}

async function loadCryptoCandles(symbol: string, interval: string, limit: number): Promise<Candle[]> {
  const { BinanceAdapter } = await import("../../../../../packages/adapter-binance/src");
  const adapter = new BinanceAdapter();

  try {
    return await adapter.getHistoricalData(symbol, { interval, limit });
  } finally {
    adapter.disconnect?.();
  }
}

async function loadCandlesForAsset(
  asset: FintechAsset,
  context: FintechDataContext,
): Promise<Candle[]> {
  if (context.marketId === "equities") {
    return loadEquityCandles(asset.symbol, context.periodId);
  }

  const candles = await loadCryptoCandles(
    asset.symbol,
    context.interval,
    Math.max(context.limit, MIN_CHART_BARS),
  );
  return ensureMinimumChartBars(candles);
}

function getMainSeriesLength(chart: ChartInstance): number {
  const runtime = chart as ChartRuntime;
  const mainId = chart.getMainSeriesId();
  const fromManager = chart.getSeriesManager()[mainId]?.data;
  if (Array.isArray(fromManager) && fromManager.length > 0) {
    return fromManager.length;
  }

  return runtime.fusion?.getMainSeries()?.data?.length ?? 0;
}

export function readMainSeriesBarCount(chart: ChartInstance): number {
  return getMainSeriesLength(chart);
}

/**
 * Shrink bar width so the full series fills the plot and ends at the right edge.
 * Default periodWidth (6px) leaves empty space when the dataset is shorter than the canvas.
 */
export function fitFintechChartViewport(chart: ChartInstance): boolean {
  chart.fit();

  const host = chart as ChartRuntime;
  const dataLength = getMainSeriesLength(chart);
  const canvasWidth =
    host.canvasWidth ?? host.model._width ?? host.canvas?.clientWidth ?? 0;

  if (!dataLength || !canvasWidth) {
    return false;
  }

  host.model._width = canvasWidth;
  host.model.endMargin = 0;
  host.model.minTimeTickWidth = 9999;

  const valueAxisWidth =
    host.renderer?.getPriceRenderingOptions()?.valueAxisWidth ??
    chart.getValueAxisWidth() ??
    host.model.valueAxisWidth ??
    80;
  const plotWidth = canvasWidth - valueAxisWidth;

  if (plotWidth <= 0) {
    return false;
  }

  host.model.periodWidth = Math.max(0.01, plotWidth / dataLength);
  host.model.viewportLeft = 0;
  return true;
}

export function alignChartViewportToEnd(chart: ChartInstance): void {
  const snapToEnd = () => {
    fitFintechChartViewport(chart);
    chart.render();
  };

  snapToEnd();
  window.requestAnimationFrame(snapToEnd);
}

function clearOverlaySeries(chart: ChartInstance, runtime: ChartRuntime): void {
  const mainPanel = getMainPanel(runtime);
  const mainSeries = runtime.model.mainSeries;

  runtime.model.instrumentsSeries = runtime.model.instrumentsSeries.filter(
    (entry) => entry.seriesId === mainSeries,
  );

  if (mainPanel) {
    mainPanel.objects = mainPanel.objects.filter(
      (object) => object.type === "SeriesObject" && object.dataLink === mainSeries,
    );
  }

  const seriesManager = chart.getSeriesManager();
  for (const key of Object.keys(seriesManager)) {
    if (key !== mainSeries) {
      delete seriesManager[key];
    }
  }
}

function upsertOverlay(
  runtime: ChartRuntime,
  seriesId: string,
  asset: FintechAsset,
  candles: Candle[],
  chartInterval: unknown,
  marketId: FintechMarketId,
): void {
  const instrument = createInstrument(asset.symbol, asset.label, marketId);
  const mainPanel = getMainPanel(runtime);
  const existingIndex = runtime.model.instrumentsSeries.findIndex(
    (entry) => entry.seriesId === seriesId,
  );

  if (existingIndex < 0) {
    runtime.model.instrumentsSeries.push({
      seriesId,
      title: asset.label,
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument,
    });

    if (mainPanel && !mainPanel.objects.some((object) => object.dataLink === seriesId)) {
      mainPanel.objects.push(createLinePlotter(seriesId, asset.color));
    }
  }

  const seriesManager = runtime.getSeriesManager();
  seriesManager[seriesId] = {
    seriesId,
    title: asset.label,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument,
    interval: chartInterval,
    data: candles,
  };
}

export type AssetPerformance = {
  asset: FintechAsset;
  changePercent: number;
  firstClose: number;
  lastClose: number;
  sparkline: number[];
};

export function readAssetPerformance(
  chart: ChartInstance,
  assets: FintechAsset[],
): AssetPerformance[] {
  const runtime = chart as ChartRuntime;
  const seriesManager = chart.getSeriesManager();

  return assets.map((asset, index) => {
    const seriesId = seriesIdForAsset(runtime, asset, index);
    const candles = (seriesManager[seriesId]?.data ?? []) as Candle[];
    const closes = candles.map((candle) => candle.c);
    const first = closes[0] ?? 0;
    const last = closes[closes.length - 1] ?? first;
    const rawChange = first > 0 ? ((last - first) / first) * 100 : 0;
    const changePercent = Number.isFinite(rawChange) ? rawChange : 0;

    return {
      asset,
      changePercent,
      firstClose: first,
      lastClose: last,
      sparkline: closes,
    };
  });
}

export function applySeriesFocus(
  chart: ChartInstance,
  assets: FintechAsset[],
  focusedAssetId: string | null,
): void {
  const runtime = chart as ChartRuntime;
  const mainPanel = getMainPanel(runtime);

  assets.forEach((asset, index) => {
    const seriesId = seriesIdForAsset(runtime, asset, index);
    const emphasized = focusedAssetId == null || focusedAssetId === asset.id;
    const color = emphasized ? asset.color : dimColor(asset.color);

    chart.applyChartInstrumentSettings(seriesId, {
      lineColor: color,
      lineDash: [],
      chartFillGradientColor: color,
    });

    applySeriesPlotterStyle(runtime, seriesId, color, {
      emphasized,
      priceTag: emphasized,
      priceLine: false,
      fillOpacity: emphasized ? 0.28 : 0.08,
    });
  });

  chart.render();
}

export async function setupFintechCompareChart(
  chart: ChartInstance,
  assets: FintechAsset[],
  context: FintechDataContext,
  focusedAssetId: string | null = null,
  themeVariant: FintechThemeVariant = "dark",
): Promise<void> {
  if (assets.length === 0) {
    return;
  }

  const chartModule = await import("@efixdata/exeria-chart");
  const chartInterval = chartModule.intervalFromSymbol(
    context.marketId === "equities" ? "1d" : context.interval,
  );
  const runtime = chart as ChartRuntime;
  const [primary, ...overlays] = assets;
  if (!primary) {
    return;
  }

  clearOverlaySeries(chart, runtime);
  clearFintechDrawingTools(chart);

  const primaryRaw = await loadCandlesForAsset(primary, context);
  const canonicalStamps = buildCanonicalStamps(primaryRaw);
  const primaryCandles = normalizeCandlesToStamps(primaryRaw, canonicalStamps);
  await chart.setMainSeriesData(primaryCandles, chartInterval, false);
  chart.setMainDrawMode("Line");
  applySeriesPlotterStyle(runtime, runtime.model.mainSeries, primary.color, {
    emphasized: true,
    priceTag: true,
    fillOpacity: 0.28,
  });

  for (const asset of overlays) {
    const seriesId = overlaySeriesId(asset.symbol);
    const candles = normalizeCandlesToStamps(
      await loadCandlesForAsset(asset, context),
      canonicalStamps,
    );
    upsertOverlay(runtime, seriesId, asset, candles, chartInterval, context.marketId);
    chart.setInstrumentDrawMode("Line", seriesId);
    chart.applyChartInstrumentSettings(seriesId, {
      lineColor: asset.color,
      lineDash: [],
    });
  }

  runtime.fusion.fullSynchronization();
  applyFintechChartChrome(chart, themeVariant);
  applySeriesFocus(chart, assets, focusedAssetId);
  alignChartViewportToEnd(chart);
}

export async function setupFintechSingleAssetChart(
  chart: ChartInstance,
  asset: FintechAsset,
  context: FintechDataContext,
  themeVariant: FintechThemeVariant = "dark",
): Promise<void> {
  const chartModule = await import("@efixdata/exeria-chart");
  const chartInterval = chartModule.intervalFromSymbol(
    context.marketId === "equities" ? "1d" : context.interval,
  );
  const runtime = chart as ChartRuntime;

  const rawCandles = await loadCandlesForAsset(asset, context);
  const canonicalStamps = buildCanonicalStamps(rawCandles);
  const candles = normalizeCandlesToStamps(rawCandles, canonicalStamps);
  await chart.setMainSeriesData(candles, chartInterval, false);
  chart.setMainDrawMode("Line");
  chart.setValueAxisMode("lin");

  hideChartVolume(chart);

  const chrome = chartChromeColors(themeVariant);
  const appearance = chart.getChartAppearanceSettings();
  chart.applyChartAppearanceSettings({
    ...appearance,
    background: chrome.background,
    gridVisible: false,
    gridMode: "none",
    chartLineColor: asset.color,
    chartFillGradientColor: asset.color,
    lastPriceLineVisible: true,
    lastPriceLabelVisible: true,
    chartLineFillVisible: true,
    chartLineFillMode: "gradient",
    chartFillGradientOpacity: 0.32,
    axisText: chrome.axisText,
  });

  runtime.model.timeAxisHeight = 0;
  runtime.model.endMargin = 0;
  runtime.model.minTimeTickWidth = 9999;
  runtime.model.minValueTickHeight = FINTECH_VALUE_TICK_HEIGHT;
  runtime.model._priceAxisExpanded = true;

  for (const panel of runtime.model.panels) {
    panel.hGrid = false;
    panel.vGrid = false;
    if (panel.main) {
      panel.zeroLine = { color: chrome.zeroLine, width: 1, dash: [] };
    }
  }

  applySeriesPlotterStyle(runtime, runtime.model.mainSeries, asset.color, {
    emphasized: true,
    priceTag: true,
    priceLine: true,
    lineWidth: 2,
    fillOpacity: 0.32,
  });

  applyPurchaseMarker(chart, candles);

  chart.setAutoScale(true);
  scheduleFintechChartRelayout(chart);
}
