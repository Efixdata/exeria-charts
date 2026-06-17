import type { ChartInstance } from "@efixdata/exeria-chart";
import { focusChartOnBar } from "../ForexOpportunityApp/chartBarPosition";
import { clearNewsChartLayer } from "../ForexOpportunityApp/newsChartLayer";

/** Focus a news bar without drawing headline/arrow overlays on the canvas. */
export function focusMarketNewsOnChart(chart: ChartInstance, barIndex: number): void {
  clearNewsChartLayer(chart);
  focusChartOnBar(chart, barIndex);
  chart.render();
}
