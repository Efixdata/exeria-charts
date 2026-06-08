import { Shape } from "./Objects2";
import type { CoreChartPanel } from "./internal-types/chart";
import type { ChartPanelObject, ChartRuntimeObject } from "./internal-types/objects";
import LIB from "./utils/chartingCommons";

export interface DrawingWorkflowHost {
  model: {
    panels: CoreChartPanel[];
  };
  renderer: {
    objects: Record<string, unknown>;
  };
  rerender(): void;
}

export interface DrawingSnapInteractor {
  drawingMagnetEnabled?: boolean;
  [key: string]: unknown;
}

export function isDrawingSnapEnabled(
  object: { sticky?: boolean },
  interactor?: DrawingSnapInteractor | null,
): boolean {
  return object.sticky === true || interactor?.drawingMagnetEnabled === true;
}

export interface DrawingSnapShapeRuntime {
  stickToCandleValue(
    point: number,
    candles: Record<string, unknown>[],
    panel: Record<string, unknown>,
    renderer: Record<string, unknown>,
    referenceValue: unknown,
  ): unknown;
  getCurrentCandles(
    index: number,
    model: Record<string, unknown>,
    seriesManager: Record<string, unknown>,
  ): Record<string, unknown>[];
}

/** Same OHLC snap path as drawing tools when the magnet (or per-tool sticky) is active. */
export function resolveMagnetAnchorValue(
  shape: DrawingSnapShapeRuntime,
  object: { sticky?: boolean },
  interactor: DrawingSnapInteractor | null | undefined,
  offsetX: number,
  offsetY: number,
  renderer: {
    getPointIndex: (x: number, model: Record<string, unknown>) => number;
    getPriceForYCoordinate: (y: number, options: Record<string, unknown>) => number;
  },
  model: Record<string, unknown>,
  panel: {
    _height: number;
    _offset: number;
    vMin: number;
    vMax: number;
    valueAxisMode: unknown;
    main?: boolean;
  },
  seriesManager: Record<string, unknown>,
): number {
  const referenceValue = LIB.getReferenceValue(object, model, seriesManager);
  const index = renderer.getPointIndex(offsetX, model);
  const yValue = offsetY - panel._offset;

  if (isDrawingSnapEnabled(object, interactor)) {
    return shape.stickToCandleValue(
      yValue,
      shape.getCurrentCandles(index, model, seriesManager),
      panel,
      renderer,
      referenceValue,
    ) as number;
  }

  const panelReference =
    panel.main === true
      ? referenceValue
      : (LIB.getPanelReferenceValue(panel, model, seriesManager) ?? referenceValue);

  return renderer.getPriceForYCoordinate(yValue, {
    panelHeight: panel._height,
    minValue: panel.vMin,
    maxValue: panel.vMax,
    valueAxisMode: panel.valueAxisMode,
    fV: panelReference,
  });
}

function isDrawingShapeObject(chart: DrawingWorkflowHost, object: ChartPanelObject): boolean {
  const type = object.type || "";
  if (!type || type === "SeriesObject" || type === "IndicatorObject" || type === "StrategyObject") {
    return false;
  }

  const rendererObject = chart.renderer.objects[type];
  return rendererObject != null && rendererObject instanceof Shape;
}

export function forEachDrawingShape(
  chart: DrawingWorkflowHost,
  callback: (object: ChartRuntimeObject) => void,
): void {
  for (const panel of chart.model.panels) {
    for (const object of panel.objects) {
      if (isDrawingShapeObject(chart, object as ChartPanelObject)) {
        callback(object as ChartRuntimeObject);
      }
    }
  }
}

export function getAllDrawingsLocked(chart: DrawingWorkflowHost): boolean {
  let found = false;
  let allLocked = true;

  forEachDrawingShape(chart, (object) => {
    found = true;
    if (object.locked !== true) {
      allLocked = false;
    }
  });

  return found && allLocked;
}

export function setAllDrawingsLocked(chart: DrawingWorkflowHost, locked: boolean): void {
  forEachDrawingShape(chart, (object) => {
    object.locked = locked;
  });
  chart.rerender();
}
