import type { ChartInstance } from "@exeria/charts";
import {
  clearMiniChartViewportUserAdjusted,
  markMiniChartViewportUserAdjusted,
} from "./miniChartViewportState";

type PanIsolationOptions = {
  trackUserViewport?: boolean;
};

const cleanupByChart = new WeakMap<ChartInstance, () => void>();

type ChartWithTopLayer = ChartInstance & {
  topLayer?: HTMLElement;
  interactor?: {
    currentMode?: { symbol?: string; onCancel?: () => void };
  };
};

function getChartTopLayer(chart: ChartInstance, container: HTMLElement): HTMLElement | null {
  const topLayer = (chart as ChartWithTopLayer).topLayer;
  if (topLayer instanceof HTMLElement) {
    return topLayer;
  }

  const layers = container.querySelectorAll(":scope > div");
  if (layers.length === 0) {
    return null;
  }

  return layers[layers.length - 1] as HTMLElement;
}

function isolateFromScrollParent(event: Event): void {
  event.stopPropagation();
}

export function ensureChartPointerMode(chart: ChartInstance): void {
  const interactor = (chart as ChartWithTopLayer).interactor;

  if (interactor?.currentMode?.symbol === "STAGE") {
    interactor.currentMode.onCancel?.();
  }

  chart.setCursor("DEFAULT");
}

/**
 * Pointer tool (DEFAULT): drag/swipe to pan. Isolates touch from row buttons and page scroll.
 */
export function enableChartPanInteraction(
  chart: ChartInstance,
  container: HTMLElement,
  options: PanIsolationOptions = {},
): void {
  ensureChartPointerMode(chart);

  cleanupByChart.get(chart)?.();

  const topLayer = getChartTopLayer(chart, container);
  const targets = [topLayer, container].filter(
    (node): node is HTMLElement => node instanceof HTMLElement,
  );

  let panOriginX: number | null = null;
  const trackUserViewport = options.trackUserViewport === true;

  const onPointerDown = (event: PointerEvent) => {
    panOriginX = event.clientX;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!trackUserViewport || panOriginX === null || event.buttons === 0) {
      return;
    }

    if (Math.abs(event.clientX - panOriginX) > 2) {
      markMiniChartViewportUserAdjusted(chart);
    }
  };

  const onPointerUp = () => {
    panOriginX = null;
  };

  const touchOptions = { passive: false } as AddEventListenerOptions;

  for (const target of targets) {
    target.addEventListener("pointerdown", onPointerDown);
    target.addEventListener("pointermove", onPointerMove);
    target.addEventListener("pointerup", onPointerUp);
    target.addEventListener("pointercancel", onPointerUp);

    // Bubble phase — chart listeners on topLayer run first, then we block parents.
    target.addEventListener("touchstart", isolateFromScrollParent, touchOptions);
    target.addEventListener("touchmove", isolateFromScrollParent, touchOptions);
    target.addEventListener("click", isolateFromScrollParent);
  }

  container.style.touchAction = "none";

  cleanupByChart.set(chart, () => {
    for (const target of targets) {
      target.removeEventListener("pointerdown", onPointerDown);
      target.removeEventListener("pointermove", onPointerMove);
      target.removeEventListener("pointerup", onPointerUp);
      target.removeEventListener("pointercancel", onPointerUp);
      target.removeEventListener("touchstart", isolateFromScrollParent, touchOptions);
      target.removeEventListener("touchmove", isolateFromScrollParent, touchOptions);
      target.removeEventListener("click", isolateFromScrollParent);
    }
    container.style.touchAction = "";
  });
}

export function disableChartPanInteraction(chart: ChartInstance): void {
  cleanupByChart.get(chart)?.();
  cleanupByChart.delete(chart);
  clearMiniChartViewportUserAdjusted(chart);
}
