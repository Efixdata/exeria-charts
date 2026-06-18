import type { ArbChartSceneScript, ChartInstance, ScriptDefinition } from "@efixdata/exeria-chart";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import {
  getScriptClone,
  getSeriesReference,
} from "../SignalTerminalApp/scriptSceneUtils";
import { applyForexNewsFeedIndicator, hideForexStrategyMarkers } from "./forexNewsIndicator";

type ScriptContext = {
  macd: boolean;
  ema: boolean;
  sma: boolean;
  bband: boolean;
  cross: boolean;
  crossOnMacdPanel: boolean;
  exceed: boolean;
};

function findMacdPanelId(chart: ChartInstance): string | null {
  const host = chart as ChartInstance & {
    model: {
      panels: Array<{
        id?: string | number;
        objects: Array<{ dataField?: string }>;
      }>;
    };
  };

  for (const panel of host.model.panels) {
    if (
      panel.objects.some(
        (object) => object.dataField === "MACDLine" || object.dataField === "MACDSignal",
      )
    ) {
      return panel.id != null ? String(panel.id) : null;
    }
  }

  return null;
}

function moveCrossStrategyToMacdPanel(chart: ChartInstance): void {
  const macdPanelId = findMacdPanelId(chart);
  if (!macdPanelId) {
    return;
  }

  const host = chart as ChartInstance & {
    model: {
      panels: Array<{
        objects: Array<{ type?: string; dataField?: string }>;
      }>;
    };
    objectsManager?: {
      moveObjectToPanel(object: unknown, paneId: string): void;
    };
  };

  if (!host.objectsManager?.moveObjectToPanel) {
    return;
  }

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      if (object.type === "StrategyObject" && object.dataField === "CrossValue") {
        host.objectsManager.moveObjectToPanel(object, macdPanelId);
      }
    }
  }
}

function applyScriptInputs(proto: ScriptDefinition, inputs?: Record<string, unknown>): void {
  if (!inputs) {
    return;
  }

  for (const [key, value] of Object.entries(inputs)) {
    const input = proto.inputs[key];
    if (input) {
      input.value = value;
    }
  }
}

function wireCrossScript(chart: ChartInstance, context: ScriptContext): ScriptDefinition {
  const cross = getScriptClone(chart, "CROSS");

  if (context.macd && cross.inputs?.LINE && cross.inputs?.SIGNAL) {
    cross.inputs.LINE.value = getSeriesReference(chart, "MACDLine");
    cross.inputs.SIGNAL.value = getSeriesReference(chart, "MACDSignal");
  } else if (context.ema && cross.inputs?.LINE && cross.inputs?.SIGNAL) {
    cross.inputs.LINE.value = getSeriesReference(chart, "c");
    cross.inputs.SIGNAL.value = getSeriesReference(chart, "EMA");
  } else if (context.sma && cross.inputs?.LINE && cross.inputs?.SIGNAL) {
    cross.inputs.LINE.value = getSeriesReference(chart, "c");
    cross.inputs.SIGNAL.value = getSeriesReference(chart, "SMAValue");
  }

  return cross;
}

function wireExceedScript(chart: ChartInstance): ScriptDefinition {
  const exceed = getScriptClone(chart, "EXCEED");
  const closeRef = getSeriesReference(chart, "c");
  if (exceed?.inputs?.UPPER && exceed?.inputs?.LOWER && exceed?.inputs?.HIGH && exceed?.inputs?.LOW) {
    exceed.inputs.UPPER.value = getSeriesReference(chart, "BBUpper");
    exceed.inputs.LOWER.value = getSeriesReference(chart, "BBLower");
    exceed.inputs.HIGH.value = closeRef;
    exceed.inputs.LOW.value = closeRef;
  }
  return exceed;
}

function setStrategyMarkerVisibility(chart: ChartInstance, context: ScriptContext): void {
  const strategies = chart.getChartStrategySettings?.() ?? [];

  for (const strategy of strategies) {
    if (strategy.key === "CROSS") {
      chart.setChartStrategyVisibility(strategy.scriptId, context.cross);
    }
    if (strategy.key === "EXCEED") {
      chart.setChartStrategyVisibility(strategy.scriptId, context.exceed);
    }
  }
}

export async function applyArbSceneScripts(
  chart: ChartInstance,
  scripts: ArbChartSceneScript[] = [],
): Promise<void> {
  const context: ScriptContext = {
    macd: false,
    ema: false,
    sma: false,
    bband: false,
    cross: false,
    crossOnMacdPanel: false,
    exceed: false,
  };

  for (const entry of scripts) {
    switch (entry.key) {
      case "EMA": {
        const ema = getScriptClone(chart, "EMA");
        if (ema.inputs.PERIODS && entry.inputs?.PERIODS == null) {
          ema.inputs.PERIODS.value = 21;
        }
        applyScriptInputs(ema, entry.inputs);
        await chart.addScript("EMA", ema);
        context.ema = true;
        break;
      }
      case "SMA": {
        const sma = getScriptClone(chart, "SMA");
        if (sma.inputs.PERIODS && entry.inputs?.PERIODS == null) {
          sma.inputs.PERIODS.value = 50;
        }
        applyScriptInputs(sma, entry.inputs);
        await chart.addScript("SMA", sma);
        context.sma = true;
        break;
      }
      case "MACD": {
        await chart.addScript("MACD");
        context.macd = true;
        break;
      }
      case "BBAND": {
        await chart.addScript("BBAND");
        context.bband = true;
        break;
      }
      case "RSI": {
        const rsi = getScriptClone(chart, "RSI");
        applyScriptInputs(rsi, entry.inputs);
        await chart.addScript("RSI", rsi);
        break;
      }
      case "ATR": {
        const atr = getScriptClone(chart, "ATR");
        applyScriptInputs(atr, entry.inputs);
        await chart.addScript("ATR", atr);
        break;
      }
      case "CEX": {
        const cex = getScriptClone(chart, "CEX");
        applyScriptInputs(cex, entry.inputs);
        await chart.addScript("CEX", cex);
        break;
      }
      case "CROSS": {
        const cross = wireCrossScript(chart, context);
        applyScriptInputs(cross, entry.inputs);
        await chart.addScript("CROSS", cross);
        context.cross = true;
        if (context.macd && entry.crossOnMacdPanel !== false) {
          context.crossOnMacdPanel = true;
        }
        break;
      }
      case "EXCEED": {
        if (!context.bband) {
          await chart.addScript("BBAND");
          context.bband = true;
        }
        const exceed = wireExceedScript(chart);
        applyScriptInputs(exceed, entry.inputs);
        await chart.addScript("EXCEED", exceed);
        context.exceed = true;
        break;
      }
      case "NEWSFEED": {
        await applyForexNewsFeedIndicator(chart);
        break;
      }
      default:
        break;
    }
  }

  if (context.cross || context.exceed) {
    setStrategyMarkerVisibility(chart, context);
  } else {
    hideForexStrategyMarkers(chart);
  }

  if (context.crossOnMacdPanel) {
    moveCrossStrategyToMacdPanel(chart);
  }

  pruneEmptyPanels(chart);
  ensureChartPointerMode(chart);
  await chart.recalculateScripts?.({ rerender: true });
}
