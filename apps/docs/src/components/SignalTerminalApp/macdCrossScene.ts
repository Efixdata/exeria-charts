import type { ChartInstance } from "@efixdata/exeria-chart";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import {
  getScriptClone,
  getSeriesReference,
  hideScriptLegends,
} from "./scriptSceneUtils";

export async function applyMacdCrossScene(chart: ChartInstance): Promise<void> {
  await chart.addScript("MACD");

  const macdLineRef = getSeriesReference(chart, "MACDLine");
  const macdSignalRef = getSeriesReference(chart, "MACDSignal");

  const cross = getScriptClone(chart, "CROSS");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  cross.inputs.LINE.value = macdLineRef;
    // @ts-ignore
  cross.inputs.SIGNAL.value = macdSignalRef;
  await chart.addScript("CROSS", cross);

  hideScriptLegends(chart);
  pruneEmptyPanels(chart);
  chart.render();
}
