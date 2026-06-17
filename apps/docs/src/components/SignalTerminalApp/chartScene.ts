import type { ChartInstance } from "@efixdata/exeria-chart";
import { ensureChartPointerMode } from "./chartPanInteraction";
import { applyScreenerStrategyScene } from "./screenerScene";

export async function applySignalTerminalScene(
  chart: ChartInstance,
  symbol: string,
): Promise<void> {
  chart.setMainDrawMode("OHLC");
  await applyScreenerStrategyScene(chart, symbol);
  ensureChartPointerMode(chart);
  chart.render();
}
