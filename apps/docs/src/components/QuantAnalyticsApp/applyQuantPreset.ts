import type { ChartInstance, ScriptDefinition } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import { getScriptClone, getSeriesReference } from "../SignalTerminalApp/scriptSceneUtils";
import { INITIAL_EQUITY } from "./constants";
import type { QuantPresetId } from "./strategyPresets";
import { findQuantPreset } from "./strategyPresets";

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

function wireCrossToMacd(chart: ChartInstance): ScriptDefinition {
  const cross = getScriptClone(chart, "CROSS");
  cross.inputs.LINE.value = getSeriesReference(chart, "MACDLine");
  cross.inputs.SIGNAL.value = getSeriesReference(chart, "MACDSignal");
  return cross;
}

function wireCrossToEmaSma(chart: ChartInstance): ScriptDefinition {
  const cross = getScriptClone(chart, "CROSS");
  cross.inputs.LINE.value = getSeriesReference(chart, "EMA");
  cross.inputs.SIGNAL.value = getSeriesReference(chart, "SMAValue");
  cross.inputs.ONDN.value = "Buy";
  cross.inputs.ONUP.value = "Sell";
  return cross;
}

function wireExceedToBbands(chart: ChartInstance): ScriptDefinition {
  const exceed = getScriptClone(chart, "EXCEED");
  const closeRef = getSeriesReference(chart, "c");
  exceed.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
  exceed.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
  exceed.inputs.HIGH.value = closeRef;
  exceed.inputs.LOW.value = closeRef;
  return exceed;
}

function wireReboundToBbands(chart: ChartInstance): ScriptDefinition {
  const rebound = getScriptClone(chart, "REBOUND");
  const closeRef = getSeriesReference(chart, "c");
  rebound.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
  rebound.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
  rebound.inputs.VALUE.value = closeRef;
  return rebound;
}

async function wireEquity(
  chart: ChartInstance,
  strategyField: string,
  initialEquity = INITIAL_EQUITY,
): Promise<void> {
  await waitForFrame();

  const equity = getScriptClone(chart, "EQUITY");
  equity.inputs.STRATEGY.value = getSeriesReference(chart, strategyField);
  equity.inputs.PRICE.value = getSeriesReference(chart, "c");
  equity.inputs.INITEQ.value = initialEquity;
  equity.inputs.CAPITAL.value = true;
  equity.inputs.LOTSIZE.value = 1;
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

export async function applyQuantPreset(
  chart: ChartInstance,
  presetId: QuantPresetId,
): Promise<void> {
  const preset = findQuantPreset(presetId);

  switch (presetId) {
    case "macdCrossover": {
      await chart.addScript("MACD");
      await waitForFrame();
      await chart.addScript("CROSS", wireCrossToMacd(chart));
      setStrategyVisibility(chart, "CROSS", true);
      await wireEquity(chart, preset.strategyField);
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
    case "emaSmaCross": {
      const ema = getScriptClone(chart, "EMA");
      ema.inputs.PERIODS.value = 12;
      await chart.addScript("EMA", ema);

      const sma = getScriptClone(chart, "SMA");
      sma.inputs.PERIODS.value = 34;
      await chart.addScript("SMA", sma);

      await waitForFrame();
      await chart.addScript("CROSS", wireCrossToEmaSma(chart));
      setStrategyVisibility(chart, "CROSS", true);
      await wireEquity(chart, preset.strategyField);
      break;
    }
    default:
      break;
  }

  pruneEmptyPanels(chart);
  ensureChartPointerMode(chart);
  await chart.recalculateScripts?.({ rerender: true });
}
