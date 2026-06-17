import type { ChartInstance } from "@efixdata/exeria-chart";

type MiniChartScriptVisibilityOptions = {
  showBollingerBands?: boolean;
  showMacd?: boolean;
};

/** Hide indicator/function plotters on mini charts; keep strategy markers visible. */
export function configureMiniChartScriptVisibility(
  chart: ChartInstance,
  options: MiniChartScriptVisibilityOptions = {},
): void {
  for (const item of chart.getChartIndicatorSettings()) {
    const visible =
      (options.showBollingerBands === true && item.key === "BBAND") ||
      (options.showMacd === true && item.key === "MACD");
    chart.setChartIndicatorVisibility(item.scriptId, visible);
    chart.setChartIndicatorPriceTagVisibility(item.scriptId, false);
  }

  for (const item of chart.getChartFunctionSettings()) {
    chart.setChartFunctionVisibility(item.scriptId, false);
    chart.setChartFunctionPriceTagVisibility(item.scriptId, false);
  }

  for (const item of chart.getChartStrategySettings()) {
    chart.setChartStrategyVisibility(item.scriptId, true);
  }
}
