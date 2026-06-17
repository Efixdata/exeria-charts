import type { ChartInstance } from "@efixdata/exeria-chart";
import type { SignalSide } from "./signalCatalog";
import { applyMiniChartSignalMarker } from "./miniChartSignalMarker";

export type MiniChartMarkerState = {
  barIndex: number;
  side: SignalSide;
};

const markerStateByChart = new WeakMap<ChartInstance, MiniChartMarkerState>();

export function setMiniChartMarkerState(chart: ChartInstance, state: MiniChartMarkerState): void {
  markerStateByChart.set(chart, state);
}

export function getMiniChartMarkerState(chart: ChartInstance): MiniChartMarkerState | undefined {
  return markerStateByChart.get(chart);
}

export function reapplyMiniChartMarker(chart: ChartInstance): void {
  const state = markerStateByChart.get(chart);
  if (!state) {
    return;
  }

  applyMiniChartSignalMarker(chart, state.barIndex, state.side);
}
