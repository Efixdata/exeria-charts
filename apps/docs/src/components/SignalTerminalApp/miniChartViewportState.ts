import type { ChartInstance } from "@exeria/charts";

const userViewportByChart = new WeakMap<ChartInstance, boolean>();

export function markMiniChartViewportUserAdjusted(chart: ChartInstance): void {
  userViewportByChart.set(chart, true);
}

export function isMiniChartViewportUserAdjusted(chart: ChartInstance): boolean {
  return userViewportByChart.get(chart) === true;
}

export function clearMiniChartViewportUserAdjusted(chart: ChartInstance): void {
  userViewportByChart.delete(chart);
}
