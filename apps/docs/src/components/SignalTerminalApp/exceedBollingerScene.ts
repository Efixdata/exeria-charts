import type { ChartInstance } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import {
  getScriptClone,
  getSeriesReference,
  hideScriptLegends,
} from "./scriptSceneUtils";

export async function applyExceedBollingerScene(chart: ChartInstance): Promise<void> {
  await chart.addScript("BBAND");

  const closeRef = getSeriesReference(chart, "c");
  const upperRef = getSeriesReference(chart, "BBUpper");
  const lowerRef = getSeriesReference(chart, "BBLower");

  const exceed = getScriptClone(chart, "EXCEED");
  exceed.inputs.UPPER.value = upperRef;
  exceed.inputs.LOWER.value = lowerRef;
  exceed.inputs.HIGH.value = closeRef;
  exceed.inputs.LOW.value = closeRef;
  exceed.inputs.ONDN.value = "Sell";
  exceed.inputs.ONUP.value = "Buy";
  await chart.addScript("EXCEED", exceed);

  hideScriptLegends(chart);
  pruneEmptyPanels(chart);
  chart.render();
}
