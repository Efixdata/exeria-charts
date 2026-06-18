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
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.UPPER.value = upperRef;
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.LOWER.value = lowerRef;
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.HIGH.value = closeRef;
    // @ts-ignore
  exceed.inputs.LOW.value = closeRef;
    // @ts-ignore
  exceed.inputs.ONDN.value = "Sell";
    // @ts-ignore
  exceed.inputs.ONUP.value = "Buy";
  await chart.addScript("EXCEED", exceed);

  hideScriptLegends(chart);
  pruneEmptyPanels(chart);
  chart.render();
}
