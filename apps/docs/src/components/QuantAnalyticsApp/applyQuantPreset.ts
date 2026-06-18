import type { ChartInstance, ScriptDefinition } from "@efixdata/exeria-chart";
import { applyInstrumentLineStyle } from "../ForexOpportunityApp/forexInstrumentLineStyle";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { applyLineChartWithGradient } from "@site/src/lib/chartSeriesDisplay";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import { getScriptClone, getSeriesReference } from "../SignalTerminalApp/scriptSceneUtils";
import type { QuantPresetId } from "./strategyPresets";
import { findQuantPreset } from "./strategyPresets";
import {
  addQuantScript,
  applyQuantCompositePanelLayout,
  getScriptPaneId,
  getScriptSeriesReference,
} from "./quantChartHelpers";

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

function applyQuantMainLineChart(chart: ChartInstance): void {
  applyLineChartWithGradient(chart);

  const host = chart as ChartInstance & { model: { mainSeries: string } };
  const lineColor = chart.getChartAppearanceSettings().chartLineColor ?? "#3b82f6";

  applyInstrumentLineStyle(chart, host.model.mainSeries, {
    lineColor,
    lineFillMode: "gradient",
    fillOpacity: 0.28,
  });
}

function wireExceedToBbands(chart: ChartInstance): ScriptDefinition {
  const exceed = getScriptClone(chart, "EXCEED");
  const closeRef = getSeriesReference(chart, "c");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
    // @ts-ignore
  exceed.inputs.HIGH.value = closeRef;
    // @ts-ignore
    // @ts-ignore
  exceed.inputs.LOW.value = closeRef;
    // @ts-ignore
  return exceed;
}
    // @ts-ignore

    // @ts-ignore
function wireReboundToBbands(chart: ChartInstance): ScriptDefinition {
    // @ts-ignore
  const rebound = getScriptClone(chart, "REBOUND");
    // @ts-ignore
  const closeRef = getSeriesReference(chart, "c");
    // @ts-ignore
    // @ts-ignore
  rebound.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
    // @ts-ignore
  rebound.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
    // @ts-ignore
  rebound.inputs.VALUE.value = closeRef;
    // @ts-ignore
  return rebound;
    // @ts-ignore
}

    // @ts-ignore
async function wireEquity(chart: ChartInstance, strategyField: string): Promise<void> {
    // @ts-ignore
  await waitForFrame();
    // @ts-ignore

    // @ts-ignore
  const equity = getScriptClone(chart, "EQUITY");
    // @ts-ignore
    // @ts-ignore
  equity.inputs.STRATEGY.value = getSeriesReference(chart, strategyField);
    // @ts-ignore
  equity.inputs.PRICE.value = getSeriesReference(chart, "c");
  await chart.addScript("EQUITY", equity);
    // @ts-ignore
}
    // @ts-ignore

    // @ts-ignore
async function wireEquityToJoinScript(
    // @ts-ignore
  chart: ChartInstance,
    // @ts-ignore
  joinScriptId: string | number,
    // @ts-ignore
): Promise<void> {
  await waitForFrame();

  const equity = getScriptClone(chart, "EQUITY");
    // @ts-ignore
  equity.inputs.STRATEGY.value = getScriptSeriesReference(chart, joinScriptId, "Join");
    // @ts-ignore
  equity.inputs.PRICE.value = getSeriesReference(chart, "c");
    // @ts-ignore
  equity.inputs.SPREAD.value = 0;
    // @ts-ignore
  equity.inputs.COMMISION.value = 0;
    // @ts-ignore
  equity.inputs.INITEQ.value = 0;
    // @ts-ignore
  equity.inputs.LOTSIZE.value = 100_000;
  await chart.addScript("EQUITY", equity);
    // @ts-ignore
}

function setStrategyVisibility(chart: ChartInstance, key: string, visible: boolean): void {
  const strategies = chart.getChartStrategySettings?.() ?? [];
    // @ts-ignore
  for (const strategy of strategies) {
    if (strategy.key === key) {
      chart.setChartStrategyVisibility(strategy.scriptId, visible);
    }
  }
}

function styleQuantOverlayIndicator(
  proto: ScriptDefinition,
    // @ts-ignore
  color: string,
    // @ts-ignore
  userName: string,
    // @ts-ignore
    // @ts-ignore
): ScriptDefinition {
  if (Array.isArray(proto.plotters)) {
    for (const plotter of proto.plotters) {
      plotter.color = color;
    // @ts-ignore
    }
    // @ts-ignore
  }
    // @ts-ignore

    // @ts-ignore
  proto.userName = userName;
    // @ts-ignore
  return proto;
}

async function applyWmaEmaCompositePreset(chart: ChartInstance): Promise<void> {
  const closeRef = getSeriesReference(chart, "c");
    // @ts-ignore
    // @ts-ignore

    // @ts-ignore
    // @ts-ignore
  const wma = styleQuantOverlayIndicator(getScriptClone(chart, "WMA"), "#e65100", "WMA 14");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  wma.inputs.PERIODS.value = 14;
    // @ts-ignore
  const wmaId = await addQuantScript(chart, "WMA", wma);
    // @ts-ignore

  const ema = styleQuantOverlayIndicator(getScriptClone(chart, "EMA"), "#7c4dff", "EMA 28");
    // @ts-ignore
  ema.inputs.PERIODS.value = 28;
    // @ts-ignore
    // @ts-ignore
  const emaId = await addQuantScript(chart, "EMA", ema);
    // @ts-ignore

    // @ts-ignore
  await waitForFrame();
    // @ts-ignore

  const emaRef = getScriptSeriesReference(chart, emaId, "EMA");
    // @ts-ignore
  const wmaRef = getScriptSeriesReference(chart, wmaId, "WMAValue");
    // @ts-ignore

  const greaterLessBuy = getScriptClone(chart, "GREATERLESS");
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  greaterLessBuy.inputs.LINE1.value = closeRef;
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  greaterLessBuy.inputs.LINE2.value = emaRef;
    // @ts-ignore
  greaterLessBuy.inputs.CHOICE.value = "greater than";
    // @ts-ignore
  greaterLessBuy.inputs.RT.value = "Buy";
    // @ts-ignore
  greaterLessBuy.pane = "new";
    // @ts-ignore
  const greaterLessBuyId = await addQuantScript(chart, "GREATERLESS", greaterLessBuy);
  const greaterLessPaneId = getScriptPaneId(chart, greaterLessBuyId);

  const greaterLessSell = getScriptClone(chart, "GREATERLESS");
    // @ts-ignore
    // @ts-ignore
  greaterLessSell.inputs.LINE1.value = closeRef;
    // @ts-ignore
  greaterLessSell.inputs.LINE2.value = emaRef;
    // @ts-ignore
    // @ts-ignore
  greaterLessSell.inputs.CHOICE.value = "less than";
    // @ts-ignore
  greaterLessSell.inputs.RT.value = "Sell";
  greaterLessSell.pane = greaterLessPaneId;
    // @ts-ignore
  const greaterLessSellId = await addQuantScript(chart, "GREATERLESS", greaterLessSell);
    // @ts-ignore

    // @ts-ignore
  const cross = getScriptClone(chart, "CROSS");
    // @ts-ignore
  cross.inputs.LINE.value = closeRef;
    // @ts-ignore
  cross.inputs.SIGNAL.value = wmaRef;
    // @ts-ignore
  cross.inputs.ONDN.value = "Sell";
    // @ts-ignore
  cross.inputs.ONUP.value = "Buy";
  cross.pane = "new";
  const crossId = await addQuantScript(chart, "CROSS", cross);

  const doubleCheckBuy = getScriptClone(chart, "DOUBLECHECK");
    // @ts-ignore
  doubleCheckBuy.inputs.FIRST.value = getScriptSeriesReference(chart, greaterLessBuyId, "GreaterLess");
    // @ts-ignore
  doubleCheckBuy.inputs.SECOND.value = getScriptSeriesReference(chart, crossId, "CrossValue");
  const doubleCheckBuyId = await addQuantScript(chart, "DOUBLECHECK", doubleCheckBuy);

  const doubleCheckSell = getScriptClone(chart, "DOUBLECHECK");
    // @ts-ignore
  doubleCheckSell.inputs.FIRST.value = getScriptSeriesReference(
    chart,
    greaterLessSellId,
    "GreaterLess",
  );
    // @ts-ignore
  doubleCheckSell.inputs.SECOND.value = getScriptSeriesReference(chart, crossId, "CrossValue");
  const doubleCheckSellId = await addQuantScript(chart, "DOUBLECHECK", doubleCheckSell);

  const join = getScriptClone(chart, "JOIN");
    // @ts-ignore
  join.inputs.FIRST.value = getScriptSeriesReference(chart, doubleCheckBuyId, "Double");
    // @ts-ignore
  join.inputs.SECOND.value = getScriptSeriesReference(chart, doubleCheckSellId, "Double");
    // @ts-ignore
  const joinId = await addQuantScript(chart, "JOIN", join);

  setStrategyVisibility(chart, "JOIN", true);
  await wireEquityToJoinScript(chart, joinId);
}

export async function applyQuantPreset(
  chart: ChartInstance,
  presetId: QuantPresetId,
): Promise<void> {
  const preset = findQuantPreset(presetId);

  switch (presetId) {
    case "macdCrossover": {
      await applyWmaEmaCompositePreset(chart);
      break;
    }
    case "bollingerBreakout": {
      await chart.addScript("BBAND");
      await waitForFrame();
      await chart.addScript("EXCEED", wireExceedToBbands(chart));
      setStrategyVisibility(chart, "EXCEED", true);
      await wireEquity(chart, preset.strategyField);
      break;
    }
    case "meanReversion": {
      await chart.addScript("BBAND");
      await waitForFrame();
      await chart.addScript("REBOUND", wireReboundToBbands(chart));
      setStrategyVisibility(chart, "REBOUND", true);
      await wireEquity(chart, preset.strategyField);
      break;
    }
    case "slowBandReversion": {
      const bband = getScriptClone(chart, "BBAND");
    // @ts-ignore
      bband.inputs.PERIODS.value = 20;
      await chart.addScript("BBAND", bband);

      await waitForFrame();
      await chart.addScript("REBOUND", wireReboundToBbands(chart));
      setStrategyVisibility(chart, "REBOUND", true);
      await wireEquity(chart, preset.strategyField);
      break;
    }
    default:
      break;
  }

  pruneEmptyPanels(chart);
  ensureChartPointerMode(chart);

  if (presetId === "macdCrossover") {
    applyQuantMainLineChart(chart);
    applyQuantCompositePanelLayout(chart);
  }

  await chart.recalculateScripts?.({ rerender: true });
}
