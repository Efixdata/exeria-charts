import type { ChartInstance } from "@efixdata/exeria-chart";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { SMA_CROSS_PERIOD } from "./smaCrossCore";
import {
  getScriptClone,
  getSeriesReference,
  hideScriptLegends,
} from "./scriptSceneUtils";

export async function applySmaCrossScene(chart: ChartInstance): Promise<void> {
  const sma = getScriptClone(chart, "SMA");
  sma.inputs.PERIODS.value = SMA_CROSS_PERIOD;
  await chart.addScript("SMA", sma);

  const closeRef = getSeriesReference(chart, "c");
  const smaRef = getSeriesReference(chart, "SMAValue");

  const cross = getScriptClone(chart, "CROSS");
  cross.inputs.LINE.value = closeRef;
  cross.inputs.SIGNAL.value = smaRef;
  cross.inputs.ONDN.value = "Sell";
  cross.inputs.ONUP.value = "Buy";
  await chart.addScript("CROSS", cross);

  hideScriptLegends(chart);
  pruneEmptyPanels(chart);
  chart.render();
}
