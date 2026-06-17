import type { ChartInstance } from "@efixdata/exeria-chart";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";

const QUANT_STRATEGY_KEYS = new Set([
  "JOIN",
  "DOUBLECHECK",
  "CROSS",
  "GREATERLESS",
  "REBOUND",
  "EXCEED",
]);

const QUANT_SCRIPT_REMOVAL_ORDER = [
  "EQUITY",
  "JOIN",
  "DOUBLECHECK",
  "CROSS",
  "GREATERLESS",
  "REBOUND",
  "EXCEED",
  "BBAND",
  "MACD",
  "WMA",
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
    const matching = scripts.filter((entry) => entry.key === key);

    for (const script of matching.reverse()) {
      if (!script.id) {
        continue;
      }

      if (QUANT_STRATEGY_KEYS.has(key)) {
        chart.removeChartStrategy?.(script.id);
      } else {
        chart.removeChartIndicator(script.id);
      }
    }
  }

  pruneEmptyPanels(chart);
}
