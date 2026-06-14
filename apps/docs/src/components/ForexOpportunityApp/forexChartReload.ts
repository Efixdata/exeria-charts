import type { ChartInstance } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { resetForexSceneState } from "./applyOpportunityScene";

const FOREX_SCENE_REMOVAL_ORDER = [
  "NEWSFEED",
  "EXCEED",
  "CROSS",
  "BBAND",
  "MACD",
  "CEX",
  "RSI",
  "ATR",
  "SMA",
  "EMA",
];

function removeStaleNewsMarkers(chart: ChartInstance): void {
  const panels =
  (
    chart as ChartInstance & {
      model: { panels: Array<{ main?: boolean; objects: Array<{ type?: string }> }> };
    }
  ).model.panels ?? [];

  for (const panel of panels) {
    if (panel.main === true) {
      continue;
    }

    panel.objects = panel.objects.filter((object) => object.type !== "NewsMarkerObject");
  }
}

export async function clearForexChartScripts(chart: ChartInstance): Promise<void> {
  const scripts = [
    ...((chart as ChartInstance & { model: { scripts: Array<{ id?: string | number; key?: string }> } })
      .model.scripts ?? []),
  ];

  for (const key of FOREX_SCENE_REMOVAL_ORDER) {
    const script = scripts.find((entry) => entry.key === key);
    if (!script?.id) {
      continue;
    }

    chart.removeChartIndicator(script.id);
  }

  removeStaleNewsMarkers(chart);

  pruneEmptyPanels(chart);
  resetForexSceneState();
}
