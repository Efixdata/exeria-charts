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
  if(exceed.inputs?.UPPER) exceed.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
  if(exceed.inputs?.LOWER) exceed.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
  if(exceed.inputs?.HIGH) exceed.inputs.HIGH.value = closeRef;
  if(exceed.inputs?.LOW) exceed.inputs.LOW.value = closeRef;
  return exceed;
}

function wireReboundToBbands(chart: ChartInstance): ScriptDefinition {
  const rebound = getScriptClone(chart, "REBOUND");
  const closeRef = getSeriesReference(chart, "c");
  if(rebound.inputs?.UPPER) rebound.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
  if(rebound.inputs?.LOWER) rebound.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
  if(rebound.inputs?.VALUE) rebound.inputs.VALUE.value = closeRef;
  return rebound;
}

async function wireEquity(chart: ChartInstance, strategyField: string): Promise<void> {
  await waitForFrame();

  const equity = getScriptClone(chart, "EQUITY");
  if(equity.inputs?.STRATEGY) equity.inputs.STRATEGY.value = getSeriesReference(chart, strategyField);
  if(equity.inputs?.PRICE) equity.inputs.PRICE.value = getSeriesReference(chart, "c");
  await chart.addScript("EQUITY", equity);
}

async function wireEquityToJoinScript(
  chart: ChartInstance,
  joinScriptId: string | number,
): Promise<void> {
  await waitForFrame();

  const equity = getScriptClone(chart, "EQUITY");
  if(equity.inputs?.STRATEGY) equity.inputs.STRATEGY.value = getScriptSeriesReference(chart, joinScriptId, "Join");
  if(equity.inputs?.PRICE) equity.inputs.PRICE.value = getSeriesReference(chart, "c");
  if(equity.inputs?.SPREAD) equity.inputs.SPREAD.value = 0;
  if(equity.inputs?.COMMISION) equity.inputs.COMMISION.value = 0;
  if(equity.inputs?.INITEQ) equity.inputs.INITEQ.value = 0;
  if(equity.inputs?.LOTSIZE) equity.inputs.LOTSIZE.value = 100_000;
  await chart.addScript("EQUITY", equity);
}

function setStrategyVisibility(chart: ChartInstance, key: string, visible: boolean): void {
  const strategies = chart.getChartStrategySettings?.() ?? [];
  for (const strategy of strategies) {
    if (strategy.key === key) {
      chart.setChartStrategyVisibility(strategy.scriptId, visible);
    }
  }
}

function styleQuantOverlayIndicator(
  proto: ScriptDefinition,
  color: string,
  userName: string,
): ScriptDefinition {
  if (Array.isArray(proto.plotters)) {
    for (const plotter of proto.plotters) {
      plotter.color = color;
    }
  }

  proto.userName = userName;
  return proto;
}

async function applyWmaEmaCompositePreset(chart: ChartInstance): Promise<void> {
  const closeRef = getSeriesReference(chart, "c");

  const wma = styleQuantOverlayIndicator(getScriptClone(chart, "WMA"), "#e65100", "WMA 14");
  if(wma.inputs?.PERIODS) wma.inputs.PERIODS.value = 14;
  const wmaId = await addQuantScript(chart, "WMA", wma);

  const ema = styleQuantOverlayIndicator(getScriptClone(chart, "EMA"), "#7c4dff", "EMA 28");
  if(ema.inputs?.PERIODS) ema.inputs.PERIODS.value = 28;
  const emaId = await addQuantScript(chart, "EMA", ema);

  await waitForFrame();

  const emaRef = getScriptSeriesReference(chart, emaId, "EMA");
  const wmaRef = getScriptSeriesReference(chart, wmaId, "WMAValue");

  const greaterLessBuy = getScriptClone(chart, "GREATERLESS");
  if(greaterLessBuy.inputs?.LINE1) greaterLessBuy.inputs.LINE1.value = closeRef;
  if(greaterLessBuy.inputs?.LINE2) greaterLessBuy.inputs.LINE2.value = emaRef;
  if(greaterLessBuy.inputs?.CHOICE) greaterLessBuy.inputs.CHOICE.value = "greater than";
  if(greaterLessBuy.inputs?.RT) greaterLessBuy.inputs.RT.value = "Buy";
  greaterLessBuy.pane = "new";
  const greaterLessBuyId = await addQuantScript(chart, "GREATERLESS", greaterLessBuy);
  const greaterLessPaneId = getScriptPaneId(chart, greaterLessBuyId);

  const greaterLessSell = getScriptClone(chart, "GREATERLESS");
  if(greaterLessSell.inputs?.LINE1) greaterLessSell.inputs.LINE1.value = closeRef;
  if(greaterLessSell.inputs?.LINE2) greaterLessSell.inputs.LINE2.value = emaRef;
  if(greaterLessSell.inputs?.CHOICE) greaterLessSell.inputs.CHOICE.value = "less than";
  if(greaterLessSell.inputs?.RT) greaterLessSell.inputs.RT.value = "Sell";
  greaterLessSell.pane = greaterLessPaneId;
  const greaterLessSellId = await addQuantScript(chart, "GREATERLESS", greaterLessSell);

  const cross = getScriptClone(chart, "CROSS");
  if(cross.inputs?.LINE) cross.inputs.LINE.value = closeRef;
  if(cross.inputs?.SIGNAL) cross.inputs.SIGNAL.value = wmaRef;
  if (cross.inputs?.ONDN) {
    cross.inputs.ONDN.value = "Sell";
  }
  if (cross.inputs?.ONUP) {
    cross.inputs.ONUP.value = "Buy";
  }
  cross.pane = "new";
  const crossId = await addQuantScript(chart, "CROSS", cross);

  const doubleCheckBuy = getScriptClone(chart, "DOUBLECHECK");
  if(doubleCheckBuy.inputs?.FIRST) doubleCheckBuy.inputs.FIRST.value = getScriptSeriesReference(chart, greaterLessBuyId, "GreaterLess");
  if(doubleCheckBuy.inputs?.SECOND) doubleCheckBuy.inputs.SECOND.value = getScriptSeriesReference(chart, crossId, "CrossValue");
  const doubleCheckBuyId = await addQuantScript(chart, "DOUBLECHECK", doubleCheckBuy);

  const doubleCheckSell = getScriptClone(chart, "DOUBLECHECK");
  if (doubleCheckSell.inputs?.FIRST) {
    doubleCheckSell.inputs.FIRST.value = getScriptSeriesReference(
      chart,
      greaterLessSellId,
      "GreaterLess",
    );
  }
  if(doubleCheckSell.inputs?.SECOND) doubleCheckSell.inputs.SECOND.value = getScriptSeriesReference(chart, crossId, "CrossValue");
  const doubleCheckSellId = await addQuantScript(chart, "DOUBLECHECK", doubleCheckSell);

  const join = getScriptClone(chart, "JOIN");
  if(join.inputs?.FIRST) join.inputs.FIRST.value = getScriptSeriesReference(chart, doubleCheckBuyId, "Double");
  if(join.inputs?.SECOND) join.inputs.SECOND.value = getScriptSeriesReference(chart, doubleCheckSellId, "Double");
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
      if(bband.inputs?.PERIODS) bband.inputs.PERIODS.value = 20;
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
