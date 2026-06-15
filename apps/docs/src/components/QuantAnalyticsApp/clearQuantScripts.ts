import type { ChartInstance } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";

const QUANT_SCRIPT_REMOVAL_ORDER = [
  "EQUITY",
  "REBOUND",
  "EXCEED",
  "CROSS",
  "BBAND",
  "MACD",
  "RSI",
  "SMA",
  "EMA",
];

export async function clearQuantChartScripts(chart: ChartInstance): Promise<void> {
  const scripts = [
    ...((chart as ChartInstance & { model: { scripts: Array<{ id?: string | number; key?: string }> } })
      .model.scripts ?? []),
  ];

  for (const key of QUANT_SCRIPT_REMOVAL_ORDER) {
    const script = scripts.find((entry) => entry.key === key);
    if (!script?.id) {
      continue;
    }

    chart.removeChartIndicator(script.id);
  }

  pruneEmptyPanels(chart);
}
