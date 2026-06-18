import type { Candle, ChartInstance } from "@efixdata/exeria-chart";

type ChartViewportHost = ChartInstance & {
  model: {
    periodWidth: number;
    viewportLeft: number;
    _midOffset: number;
    _width: number;
    mainSeries?: string;
  };
  renderer?: {
    getIndexPoint: (index: number, model: ChartViewportHost["model"]) => number;
    getPointIndex: (x: number, model: ChartViewportHost["model"]) => number;
    getPriceRenderingOptions: () => { valueAxisWidth: number };
    getYCoordinateForPrice: (
      price: number,
      options: { panelHeight: number; minValue: number; maxValue: number },
    ) => number;
  };
  moveIndexToPoint?: (index: number, x: number) => void;
};

type InteractorWithPanel = {
  getMainPanel?: () => {
    _offset: number;
    _height: number;
    vMin: number;
    vMax: number;
    valueAxisMode?: string;
    main?: boolean;
  };
};

type ChartPanelLike = {
  _offset: number;
  _height: number;
  vMin: number;
  vMax: number;
  valueAxisMode?: string;
  main?: boolean;
};

function getMainChartPanel(chart: ChartInstance): ChartPanelLike | null {
  const host = chart as ChartViewportHost;
  const fromModel = host.model?.panels?.find((panel) => panel.main === true);
  if (fromModel) {
    return fromModel as ChartPanelLike;
  }

  const interactor = chart.getInteractor() as InteractorWithPanel;
  return interactor.getMainPanel?.() ?? null;
}

function isReasonableForexPrice(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value < 10_000;
}

export function getMainSeriesCandles(chart: ChartInstance): Candle[] {
  const host = chart as ChartViewportHost;
  const seriesManager = chart.getSeriesManager();
  const mainKey = host.model?.mainSeries;

  if (mainKey && Array.isArray(seriesManager[mainKey]?.data)) {
    return seriesManager[mainKey]!.data as Candle[];
  }

  let longest: Candle[] = [];
  for (const series of Object.values(seriesManager)) {
    if (Array.isArray(series.data) && series.data.length > longest.length) {
      longest = series.data as Candle[];
    }
  }

  return longest;
}

export function resolveBarScreenPosition(
  chart: ChartInstance,
  barIndex: number,
  price: number,
): { x: number; y: number } | null {
  const host = chart as ChartViewportHost;
  const panel = getMainChartPanel(chart);
  const renderer = host.renderer;

  if (!panel || !renderer?.getIndexPoint || !renderer.getYCoordinateForPrice) {
    return null;
  }

  if (!isReasonableForexPrice(price)) {
    return null;
  }

  const indexX =
    renderer.getIndexPoint(barIndex, host.model) + (host.model._midOffset ?? 0);
  const y =
    renderer.getYCoordinateForPrice(price, {
      panelHeight: panel._height,
      minValue: panel.vMin,
      maxValue: panel.vMax,
      valueAxisMode: panel.valueAxisMode,
    }) + panel._offset;

  if (!Number.isFinite(indexX) || !Number.isFinite(y)) {
    return null;
  }

  return { x: indexX, y: y + 14 };
}

export function resolveCanvasOffsetInStack(
  canvas: HTMLElement,
  stack: HTMLElement,
): { x: number; y: number } {
  const canvasRect = canvas.getBoundingClientRect();
  const stackRect = stack.getBoundingClientRect();

  return {
    x: canvasRect.left - stackRect.left,
    y: canvasRect.top - stackRect.top,
  };
}

export function resolveStackPositionFromClientPoint(
  clientX: number,
  clientY: number,
  stack: HTMLElement,
): { x: number; y: number } {
  const stackRect = stack.getBoundingClientRect();
  return {
    x: clientX - stackRect.left,
    y: clientY - stackRect.top,
  };
}

export function resolveCenteredCalloutPosition(
  canvas: HTMLElement,
  stack: HTMLElement,
): { x: number; y: number } {
  const offset = resolveCanvasOffsetInStack(canvas, stack);
  return {
    x: offset.x + Math.max(120, canvas.clientWidth * 0.52),
    y: offset.y + Math.max(96, canvas.clientHeight * 0.22),
  };
}

export function resolveNewsCalloutPosition(
  chart: ChartInstance,
  barIndex: number,
  canvas: HTMLElement,
  stack: HTMLElement,
): { x: number; y: number } | null {
  const candles = getMainSeriesCandles(chart);
  const low = candles[barIndex]?.l;

  if (!isReasonableForexPrice(low ?? NaN)) {
    return null;
  }

  const plotPosition = resolveBarScreenPosition(chart, barIndex, low);
  if (!plotPosition) {
    return null;
  }

  const offset = resolveCanvasOffsetInStack(canvas, stack);
  const position = {
    x: plotPosition.x + offset.x,
    y: plotPosition.y + offset.y,
  };

  if (!isPlotPositionWithinCanvas(position, offset, canvas)) {
    return null;
  }

  return position;
}

function isPlotPositionWithinCanvas(
  position: { x: number; y: number },
  canvasOffset: { x: number; y: number },
  canvas: HTMLElement,
): boolean {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (width <= 0 || height <= 0) {
    return false;
  }

  const plotX = position.x - canvasOffset.x;
  const plotY = position.y - canvasOffset.y;

  return (
    Number.isFinite(plotX) &&
    Number.isFinite(plotY) &&
    plotX >= -48 &&
    plotX <= width + 48 &&
    plotY >= -48 &&
    plotY <= height + 48
  );
}

type ChartScrollHost = ChartInstance & {
  fit: () => void;
  moveToEnd?: (options?: { rerender?: boolean }) => void;
  canvasWidth?: number;
  canvas?: { clientWidth: number };
};

function resolvePlotWidth(chart: ChartInstance): { plotWidth: number; canvasWidth: number } {
  const host = chart as ChartViewportHost & ChartScrollHost;
  const canvasWidth =
    host.canvasWidth ?? host.model._width ?? host.canvas?.clientWidth ?? 0;
  const valueAxisWidth =
    host.renderer?.getPriceRenderingOptions()?.valueAxisWidth ??
    chart.getValueAxisWidth?.() ??
    80;
  const plotWidth = canvasWidth - valueAxisWidth;

  return { plotWidth, canvasWidth };
}

/** Stretch or compress bars so the full series spans the plot with the last bar at the right edge. */
export function fitChartSeriesToPlotWidth(chart: ChartInstance): boolean {
  chart.fit();

  const host = chart as ChartViewportHost & ChartScrollHost;
  const candles = getMainSeriesCandles(chart);
  const dataLength = candles.length;
  const { plotWidth, canvasWidth } = resolvePlotWidth(chart);

  if (!dataLength || !canvasWidth || plotWidth <= 0) {
    return false;
  }

  host.model._width = canvasWidth;
  host.model.endMargin = 0;
  host.model.periodWidth = Math.max(0.01, plotWidth / dataLength);
  host.model.viewportLeft = 0;
  return true;
}

export function scrollChartToEnd(chart: ChartInstance): void {
  const host = chart as ChartScrollHost;

  const scroll = () => {
    host.fit();

    const candles = getMainSeriesCandles(chart);
    const dataLength = candles.length;
    const { plotWidth } = resolvePlotWidth(chart);

    if (dataLength > 0 && plotWidth > 0) {
      const dataWidth = host.model.periodWidth * dataLength;
      if (dataWidth < plotWidth) {
        fitChartSeriesToPlotWidth(chart);
        chart.render();
        return;
      }
    }

    host.moveToEnd?.({ rerender: true });
  };

  scroll();

  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      requestAnimationFrame(scroll);
    });
    return;
  }

  scroll();
}

export function resolveBarIndexFromClientX(
  chart: ChartInstance,
  clientX: number,
  container: HTMLElement,
): number | null {
  const host = chart as ChartViewportHost;
  const renderer = host.renderer;

  if (!renderer?.getPointIndex) {
    return null;
  }

  const rect = container.getBoundingClientRect();
  const x = clientX - rect.left;
  const index = renderer.getPointIndex(x, host.model);

  if (!Number.isFinite(index) || index < 0) {
    return null;
  }

  return Math.floor(index);
}

export function focusChartOnBar(
  chart: ChartInstance,
  barIndex: number,
  options?: { plotCenterRatio?: number },
): void {
  const host = chart as ChartViewportHost;
  const candles = getMainSeriesCandles(chart);

  if (!candles.length || !host.renderer) {
    return;
  }

  chart.fit();

  const canvasWidth = host.model._width;
  const valueAxisWidth = host.renderer.getPriceRenderingOptions()?.valueAxisWidth ?? 80;
  const plotWidth = canvasWidth - valueAxisWidth;

  if (plotWidth <= 0) {
    return;
  }

  const targetX = plotWidth * (options?.plotCenterRatio ?? 0.52);
  const safeIndex = Math.max(0, Math.min(barIndex, candles.length - 1));

  if (typeof host.moveIndexToPoint === "function") {
    host.moveIndexToPoint(safeIndex, targetX);
  } else {
    const periodWidth = Math.max(host.model.periodWidth, 0.01);
    host.model.viewportLeft = Math.max(0, periodWidth * safeIndex - targetX);
  }

  // Autoscale uses visible bar indices — refit after panning or candles disappear.
  chart.fit();
  chart.render();
}
