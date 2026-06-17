import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
import { getMiniChartMarkerState } from "./miniChartMarkerState";

/**
 * Horizontal extent of the drawing-tool price tag to the right of the anchor bar
 * (defaultLineLen 50 + pentagon + label — see packages/chart priceTag.ts).
 */
export const SIGNAL_PRICE_TAG_EXTENSION_PX = 118;

/** Gap between the last visible bar and the value-axis band. */
export const SIGNAL_TAG_END_MARGIN = 48;

/** Signal bars this close to the live edge need viewport / flip handling. */
export const SIGNAL_TAG_EDGE_BARS = 14;

type ViewportHost = ChartInstance & {
  model: {
    _width: number;
    periodWidth: number;
    endMargin: number;
    viewportLeft: number;
  };
  moveIndexToPoint?: (index: number, x: number) => void;
  moveToEnd?: (options?: { rerender?: boolean }) => void;
  renderer?: {
    getPriceRenderingOptions: () => { valueAxisWidth: number };
  };
};

function getMainSeriesLength(chart: ChartInstance): number {
  const seriesManager = chart.getSeriesManager();
  const host = chart as ChartInstance & { model?: { mainSeries?: string } };
  const mainKey = host.model?.mainSeries;

  if (mainKey) {
    const main = seriesManager[mainKey];
    if (Array.isArray(main?.data) && main.data.length > 0) {
      return (main.data as Candle[]).length;
    }
  }

  for (const series of Object.values(seriesManager)) {
    if (Array.isArray(series.data) && series.data.length > 0) {
      return series.data.length;
    }
  }

  return 0;
}

/** When the signal sits on the last candles, draw the tag to the left of the anchor. */
export function shouldFlipSignalPriceTag(dataLength: number, signalBarIndex: number): boolean {
  if (dataLength <= 0) {
    return false;
  }

  return dataLength - 1 - signalBarIndex <= 2;
}

/**
 * Shrink bar width so every candle in the mini-chart window fits in the plot.
 * Without this, the default `periodWidth` (6) only shows the first ~30–40 bars.
 */
export function fitMiniChartSeriesViewport(chart: ChartInstance): boolean {
  const host = chart as ViewportHost;
  const dataLength = getMainSeriesLength(chart);
  const canvasWidth = host.model._width;

  if (!dataLength || !canvasWidth) {
    return false;
  }

  host.model.endMargin = SIGNAL_TAG_END_MARGIN;

  const valueAxisWidth =
    host.renderer?.getPriceRenderingOptions()?.valueAxisWidth ?? 80;
  const plotWidth = canvasWidth - valueAxisWidth;

  if (plotWidth <= 0) {
    return false;
  }

  const usableWidth = Math.max(plotWidth - host.model.endMargin, plotWidth * 0.9);
  host.model.periodWidth = Math.max(0.01, usableWidth / dataLength);
  host.model.viewportLeft = 0;
  return true;
}

/** Fit the full series, then nudge the viewport when the signal sits near the live edge. */
export function fitMiniChartAutoViewport(
  chart: ChartInstance,
  signalBarIndex?: number,
): void {
  if (!fitMiniChartSeriesViewport(chart)) {
    return;
  }

  fitMiniChartSignalTagViewport(chart, signalBarIndex);
}

function moveAnchorToX(host: ViewportHost, anchorIndex: number, targetX: number): void {
  const periodWidth = Math.max(host.model.periodWidth, 0.01);
  const safeX = Math.max(periodWidth * 2, targetX);

  if (typeof host.moveIndexToPoint === "function") {
    host.moveIndexToPoint(anchorIndex, safeX);
    return;
  }

  let viewportLeft = periodWidth * anchorIndex - safeX;
  if (viewportLeft < 0) {
    viewportLeft = 0;
  }
  host.model.viewportLeft = viewportLeft;
}

/**
 * Scroll / margin so a signal price tag is not clipped by the value axis.
 * Right-pointing tags: anchor bar at `plotWidth - endMargin - tagExtension`.
 * Left-pointing (flipped): nudge anchor slightly left of the axis edge.
 */
export function fitMiniChartSignalTagViewport(
  chart: ChartInstance,
  signalBarIndex?: number,
): void {
  const host = chart as ViewportHost;
  const markerIndex = signalBarIndex ?? getMiniChartMarkerState(chart)?.barIndex;
  const dataLength = getMainSeriesLength(chart);
  const canvasWidth = host.model._width;

  if (markerIndex === undefined || !dataLength || !canvasWidth) {
    return;
  }

  const lastIndex = dataLength - 1;
  const anchorIndex = Math.max(0, Math.min(markerIndex, lastIndex));
  const barsFromEnd = lastIndex - anchorIndex;

  if (barsFromEnd > SIGNAL_TAG_EDGE_BARS) {
    return;
  }

  host.model.endMargin = SIGNAL_TAG_END_MARGIN;

  const valueAxisWidth =
    host.renderer?.getPriceRenderingOptions()?.valueAxisWidth ?? 80;
  const plotWidth = canvasWidth - valueAxisWidth;

  if (plotWidth <= 0) {
    return;
  }

  const axisEdgeX = plotWidth - host.model.endMargin;

  if (shouldFlipSignalPriceTag(dataLength, anchorIndex)) {
    moveAnchorToX(host, anchorIndex, axisEdgeX - 24);
    return;
  }

  moveAnchorToX(
    host,
    anchorIndex,
    axisEdgeX - SIGNAL_PRICE_TAG_EXTENSION_PX,
  );
}

/** Refit after a new hourly bar so the signal bar and markers stay in view. */
export function followMiniChartLiveEdge(chart: ChartInstance): void {
  const markerState = getMiniChartMarkerState(chart);

  if (getMainSeriesLength(chart) <= 0) {
    return;
  }

  fitMiniChartAutoViewport(chart, markerState?.barIndex);
}
