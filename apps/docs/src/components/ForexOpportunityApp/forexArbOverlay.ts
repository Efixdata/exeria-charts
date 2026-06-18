import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
import type { ArbChartSceneOverlay } from "@efixdata/exeria-chart";
import { removeChartOverlay } from "../CryptoTerminalApp/chartCompareOverlay";
import { PIP_SIZE } from "./constants";
import { applyInstrumentLineStyle } from "./forexInstrumentLineStyle";
import { findForexTimeframe, type ForexTimeframeId } from "./forexInstruments";
import { loadStaticForexCandles } from "./forexStaticData";

const ARB_OVERLAY_SYMBOL = "GBP/USD";
const ARB_QUOTED_CROSS = "EUR/GBP";
const STATIC_CANDLE_LIMIT = 1000;

export type ArbSnapshot = {
  impliedEurGbp: number;
  quotedEurGbp: number;
  edgePips: number;
};

export async function fetchPairCandles(
  symbol: string,
  timeframeId: ForexTimeframeId,
): Promise<Candle[]> {
  return loadStaticForexCandles(symbol, timeframeId, STATIC_CANDLE_LIMIT);
}

export function computeTriangularArb(
  eurUsd: Candle[],
  gbpUsd: Candle[],
  eurGbp: Candle[],
): ArbSnapshot | null {
  const main = eurUsd.at(-1);
  const cable = gbpUsd.at(-1);
  const cross = eurGbp.at(-1);

  if (!main || !cable || !cross || cable.c === 0) {
    return null;
  }

  const impliedEurGbp = main.c / cable.c;
  const quotedEurGbp = cross.c;
  const edgePips = (impliedEurGbp - quotedEurGbp) / PIP_SIZE;

  return {
    impliedEurGbp,
    quotedEurGbp,
    edgePips: Math.round(edgePips * 10) / 10,
  };
}

export async function applyTriangularArbOverlay(
  chart: ChartInstance,
  timeframeId: ForexTimeframeId,
): Promise<ArbSnapshot | null> {
  clearTriangularArbOverlay(chart);

  const tf = findForexTimeframe(timeframeId);
  const [eurUsd, gbpUsd, eurGbp] = await Promise.all([
    fetchPairCandles("EUR/USD", timeframeId),
    fetchPairCandles(ARB_OVERLAY_SYMBOL, timeframeId),
    fetchPairCandles(ARB_QUOTED_CROSS, timeframeId),
  ]);

  const arb = computeTriangularArb(eurUsd, gbpUsd, eurGbp);
  if (!arb) {
    return null;
  }

  await applyFixtureOverlay(chart, ARB_OVERLAY_SYMBOL, gbpUsd, tf.interval);
  return arb;
}

export function clearTriangularArbOverlay(chart: ChartInstance): void {
  for (const symbol of ["GBPUSD", "GBP/USD", "EURUSD", "EUR/USD"]) {
    removeChartOverlay(chart, symbol);
  }
}

export function clearAllForexOverlays(chart: ChartInstance): void {
  const runtime = chart as ChartInstance & {
    model: {
      instrumentsSeries: Array<{ seriesId: string }>;
    };
  };

  const overlaySymbols = runtime.model.instrumentsSeries
    .filter((entry) => entry.seriesId.startsWith("overlay-"))
    .map((entry) => entry.seriesId.replace(/^overlay-/, ""));

  for (const symbol of overlaySymbols) {
    removeChartOverlay(chart, symbol);
  }
}

export async function applyCorrelationOverlay(
  chart: ChartInstance,
  overlaySymbol: string,
  timeframeId: ForexTimeframeId,
): Promise<void> {
  await applySceneOverlay(
    chart,
    { symbol: overlaySymbol, renderAs: "Line", color: "#f59e0b", valueAxisMode: "%" },
    timeframeId,
  );
}

export async function applySceneOverlay(
  chart: ChartInstance,
  overlay: ArbChartSceneOverlay,
  timeframeId: ForexTimeframeId,
): Promise<void> {
  const tf = findForexTimeframe(timeframeId);
  const overlayCandles = await fetchPairCandles(overlay.symbol, timeframeId);
  await applyFixtureOverlay(chart, overlay.symbol, overlayCandles, tf.interval, overlay);
}

export async function applySceneOverlays(
  chart: ChartInstance,
  overlays: ArbChartSceneOverlay[],
  timeframeId: ForexTimeframeId,
): Promise<void> {
  for (const overlay of overlays) {
    await applySceneOverlay(chart, overlay, timeframeId);
  }

  const axisMode = overlays.find((overlay) => overlay.valueAxisMode)?.valueAxisMode ?? "%";
  chart.setValueAxisMode(axisMode);
  chart.render();
}

function createOverlayLinePlotter(seriesId: string, color: string) {
  return {
    id: seriesId,
    type: "SeriesObject",
    dataLink: seriesId,
    renderAs: "Line",
    color,
    stroke: [1],
    dash: [],
    width: 1.5,
    priceTag: false,
    priceLine: false,
    openDataField: "o",
    highDataField: "h",
    lowDataField: "l",
    closeDataField: "c",
    dataField: "c",
    strokeStyle: color,
    hidden: false,
    _hit: false,
    _hitAnchor: null,
    _hitArrow: null,
    selected: false,
  };
}

async function applyFixtureOverlay(
  chart: ChartInstance,
  symbol: string,
  candles: Candle[],
  interval: string,
  style?: ArbChartSceneOverlay,
): Promise<void> {
  const chartModule = await import("@efixdata/exeria-chart");
  const chartInterval = chartModule.intervalFromSymbol(interval);
  const seriesId = `overlay-${symbol}`;
  const lineColor = style?.color ?? "#f59e0b";

  const runtime = chart as ChartInstance & {
    model: {
      mainSeries: string;
      panels: Array<{ main?: boolean; objects: Array<{ dataLink?: string; color?: string }> }>;
      instrumentsSeries: Array<{
        seriesId: string;
        title: string;
        labels: string[];
        fields: string[];
        instrument: Record<string, unknown>;
      }>;
    };
    fusion: { fullSynchronization(): void };
  };

  const mainPanel = runtime.model.panels.find((panel) => panel.main) ?? runtime.model.panels[0];

  if (!runtime.model.instrumentsSeries.some((entry) => entry.seriesId === seriesId)) {
    runtime.model.instrumentsSeries.push({
      seriesId,
      title: symbol,
      labels: ["O", "H", "L", "C", "V", "I"],
      fields: ["o", "h", "l", "c", "v", "i"],
      instrument: { symbol, description: symbol },
    });

    if (mainPanel && !mainPanel.objects.some((object) => object.dataLink === seriesId)) {
      mainPanel.objects.push(createOverlayLinePlotter(seriesId, lineColor));
    }
  } else if (mainPanel) {
    const plotterIndex = mainPanel.objects.findIndex((object) => object.dataLink === seriesId);
    if (plotterIndex >= 0) {
      const plotter = mainPanel.objects[plotterIndex] as ReturnType<typeof createOverlayLinePlotter>;
      plotter.color = lineColor;
      plotter.strokeStyle = lineColor;
      plotter.hidden = false;
      plotter.dataField = "c";
    } else {
      mainPanel.objects.push(createOverlayLinePlotter(seriesId, lineColor));
    }
  }

  const seriesManager = chart.getSeriesManager();
  seriesManager[seriesId] = {
    seriesId,
    title: symbol,
    labels: ["O", "H", "L", "C", "V", "I"],
    fields: ["o", "h", "l", "c", "v", "i"],
    instrument: { symbol, description: symbol },
    interval: chartInterval,
    data: candles,
  };

  runtime.fusion.fullSynchronization();
  applyInstrumentLineStyle(chart, seriesId, {
    lineColor,
    lineFillMode: style?.lineFillMode ?? "gradient",
    fillOpacity: style?.fillOpacity ?? 0.28,
  });

  if (style?.valueAxisMode) {
    chart.setValueAxisMode(style.valueAxisMode);
  }

  chart.render();
}
