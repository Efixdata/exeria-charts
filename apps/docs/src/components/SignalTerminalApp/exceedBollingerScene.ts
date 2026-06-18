import type { ChartInstance } from "@efixdata/exeria-chart";
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
  if (exceed?.inputs) {
    if (exceed.inputs.UPPER) exceed.inputs.UPPER.value = upperRef;
    if (exceed.inputs.LOWER) exceed.inputs.LOWER.value = lowerRef;
    if (exceed.inputs.HIGH) exceed.inputs.HIGH.value = closeRef;
    if (exceed.inputs.LOW) exceed.inputs.LOW.value = closeRef;
    if (exceed.inputs.ONDN) exceed.inputs.ONDN.value = "Sell";
    if (exceed.inputs.ONUP) exceed.inputs.ONUP.value = "Buy";
  }
  await chart.addScript("EXCEED", exceed);

  hideScriptLegends(chart);
  pruneEmptyPanels(chart);
  chart.render();
}
