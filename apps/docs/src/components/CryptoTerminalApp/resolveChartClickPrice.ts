import type { ChartInstance } from "@exeria/charts";

type ChartPanel = {
  _offset: number;
  _height: number;
  vMin: number;
  vMax: number;
};

type ChartRuntime = ChartInstance & {
  renderer?: {
    getPriceForYCoordinate: (
      y: number,
      options: { panelHeight: number; minValue: number; maxValue: number },
    ) => number;
  };
};

type InteractorWithPanel = {
  getPanel?: (y: number) => ChartPanel | null;
};

export function resolveChartPriceAtClientY(
  chart: ChartInstance,
  container: HTMLElement,
  clientY: number,
): number | null {
  const rect = container.getBoundingClientRect();
  const offsetY = clientY - rect.top;

  const runtime = chart as ChartRuntime;
  const renderer = runtime.renderer;
  const interactor = chart.getInteractor() as InteractorWithPanel;

  if (!renderer?.getPriceForYCoordinate || !interactor.getPanel) {
    return null;
  }

  const panel = interactor.getPanel(offsetY);
  if (!panel) {
    return null;
  }

  const price = renderer.getPriceForYCoordinate(offsetY - panel._offset, {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
  });

  return Number.isFinite(price) ? price : null;
}

export function resolveChartClickPrice(
  chart: ChartInstance,
  container: HTMLElement,
  event: MouseEvent,
): number | null {
  return resolveChartPriceAtClientY(chart, container, event.clientY);
}

const TRADE_CHART_OBJECT_TYPES = new Set(["POSITION", "SL", "TP"]);

const CHART_BACKGROUND_OBJECT_TYPES = new Set([
  "SeriesObject",
  "IndicatorObject",
  "StrategyObject",
]);

function isTradeChartObjectType(type: string): boolean {
  if (TRADE_CHART_OBJECT_TYPES.has(type)) {
    return true;
  }

  return type.includes("LIMIT") || type.includes("STOP");
}

/** Skip order/alert price picking when the user interacted with drawings or dragged. */
export function shouldIgnoreChartClickForOrderPrice(chart: ChartInstance): boolean {
  const interactor = chart.getInteractor() as {
    currentHitObject?: { type?: string };
    currentMode?: { symbol?: string };
  };

  const mode = interactor.currentMode?.symbol;
  if (mode && mode !== "DEFAULT" && mode !== "CROSSHAIR") {
    return true;
  }

  const hitType = interactor.currentHitObject?.type;
  if (!hitType) {
    return false;
  }

  if (CHART_BACKGROUND_OBJECT_TYPES.has(hitType)) {
    return false;
  }

  if (isTradeChartObjectType(hitType)) {
    return true;
  }

  return true;
}
