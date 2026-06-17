import type { ChartInstance } from "@efixdata/exeria-chart";
import {
  disableChartPanInteraction,
  enableChartPanInteraction,
  ensureChartPointerMode,
} from "./chartPanInteraction";

export { ensureChartPointerMode };

export function enableMiniChartPan(chart: ChartInstance, container: HTMLElement): void {
  enableChartPanInteraction(chart, container, { trackUserViewport: true });
}

export function disableMiniChartPan(chart: ChartInstance): void {
  disableChartPanInteraction(chart);
}
