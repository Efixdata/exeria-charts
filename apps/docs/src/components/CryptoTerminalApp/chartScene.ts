import type { Candle, ChartInstance } from "@exeria/charts";
import { drawPreviewOverlays } from "../themeCreator/core";

type ChartWithScripts = ChartInstance & {
  model: {
    scripts: Array<{ key?: string }>;
  };
};

function hasScript(chart: ChartInstance, scriptKey: string): boolean {
  const scripts = (chart as ChartWithScripts).model?.scripts ?? [];
  return scripts.some((entry) => entry.key === scriptKey);
}

export function activatePointer(chart: ChartInstance): void {
  chart.setCursor("DEFAULT");
}

export async function applyCryptoTerminalScene(
  chart: ChartInstance,
  candles: Candle[],
): Promise<void> {
  chart.setMainDrawMode("OHLC");

  if (!hasScript(chart, "EMA")) {
    const ema = structuredClone(chart.getScripts().EMA);
    ema.inputs.PERIODS.value = 21;
    await chart.addScript("EMA", ema);
  }

  if (!hasScript(chart, "RSI")) {
    await chart.addScript("RSI");
  }

  if (candles.length > 0) {
    drawPreviewOverlays(chart, candles);
  }

  pruneEmptyPanels(chart);
  activatePointer(chart);
  chart.render();
}

export function pruneEmptyPanels(chart: ChartInstance): void {
  const objectsManager = (
    chart as ChartInstance & { objectsManager?: { removeEmptyPanels(): void } }
  ).objectsManager;
  objectsManager?.removeEmptyPanels();
}
