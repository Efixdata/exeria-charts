import type { ChartInstance } from "@efixdata/exeria-chart";
import { applyExceedBollingerScene } from "./exceedBollingerScene";
import { applyMacdCrossScene } from "./macdCrossScene";
import { applySmaCrossScene } from "./smaCrossScene";
import { configureMiniChartScriptVisibility } from "./miniChartScriptVisibility";
import { getSymbolStrategy } from "./screenerStrategy";

export async function applyScreenerStrategyScene(
  chart: ChartInstance,
  symbol: string,
): Promise<void> {
  switch (getSymbolStrategy(symbol)) {
    case "exceed-bbands":
      await applyExceedBollingerScene(chart);
      return;
    case "macd-cross":
      await applyMacdCrossScene(chart);
      return;
    default:
      await applySmaCrossScene(chart);
  }
}

export function configureScreenerMiniChartVisibility(
  chart: ChartInstance,
  symbol: string,
): void {
  const strategy = getSymbolStrategy(symbol);

  configureMiniChartScriptVisibility(chart, {
    showBollingerBands: strategy === "exceed-bbands",
    showMacd: strategy === "macd-cross",
  });
}
