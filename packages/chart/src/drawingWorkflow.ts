import { Shape } from "./Objects2";
import type { CoreChartPanel } from "./internal-types/chart";
import type { ChartPanelObject, ChartRuntimeObject } from "./internal-types/objects";

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
