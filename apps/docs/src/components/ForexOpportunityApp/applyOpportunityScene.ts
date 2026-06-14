import type { Candle, ChartInstance } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import {
  getScriptClone,
  getSeriesReference,
} from "../SignalTerminalApp/scriptSceneUtils";
import { ensureChartPointerMode } from "../SignalTerminalApp/chartPanInteraction";
import type { ForexTimeframeId } from "./forexInstruments";
import type { ForexOpportunity } from "./opportunityCatalog";
import {
  applyCorrelationOverlay,
  applyTriangularArbOverlay,
  clearTriangularArbOverlay,
  type ArbSnapshot,
} from "./forexArbOverlay";
import { PIP_SIZE } from "./constants";
import { focusChartOnBar } from "./chartBarPosition";
import {
  findLastChartCrossMarker,
  findLastExceedHit,
  type StrategySignalHit,
} from "./forexStrategySignals";
import {
  applyForexNewsFeedIndicator,
  hideForexStrategyMarkers,
  resetForexNewsFeedState,
} from "./forexNewsIndicator";

const sceneDrawingIds: Array<string | number> = [];
let baseSceneApplied = false;

export type ApplySceneResult = {
  focusBarIndex?: number;
  signalHit?: StrategySignalHit | null;
  arbSnapshot?: ArbSnapshot | null;
};

function collectSceneId(result: string | number | void): void {
  if (result !== undefined && result !== null) {
    sceneDrawingIds.push(result);
  }
}

export function clearOpportunityDrawings(chart: ChartInstance): void {
  clearTriangularArbOverlay(chart);

  while (sceneDrawingIds.length > 0) {
    const id = sceneDrawingIds.pop();
    if (id !== undefined) {
      chart.toolDrawer.deleteTool(id);
    }
  }
  chart.render();
}

export async function applyForexBaseScene(
  chart: ChartInstance,
  options?: { force?: boolean },
): Promise<void> {
  if (baseSceneApplied && !options?.force) {
    return;
  }

  chart.setMainDrawMode("OHLC");

  const ema = structuredClone(chart.getScripts().EMA);
  ema.inputs.PERIODS.value = 21;
  await chart.addScript("EMA", ema);

  await chart.addScript("MACD");
  const macdLineRef = getSeriesReference(chart, "MACDLine");
  const macdSignalRef = getSeriesReference(chart, "MACDSignal");
  const cross = getScriptClone(chart, "CROSS");
  cross.inputs.LINE.value = macdLineRef;
  cross.inputs.SIGNAL.value = macdSignalRef;
  await chart.addScript("CROSS", cross);

  await chart.addScript("BBAND");
  const closeRef = getSeriesReference(chart, "c");
  const upperRef = getSeriesReference(chart, "BBUpper");
  const lowerRef = getSeriesReference(chart, "BBLower");
  const exceed = getScriptClone(chart, "EXCEED");
  exceed.inputs.UPPER.value = upperRef;
  exceed.inputs.LOWER.value = lowerRef;
  exceed.inputs.HIGH.value = closeRef;
  exceed.inputs.LOW.value = closeRef;
  await chart.addScript("EXCEED", exceed);

  await applyForexNewsFeedIndicator(chart);
  hideForexStrategyMarkers(chart);

  pruneEmptyPanels(chart);
  ensureChartPointerMode(chart);
  baseSceneApplied = true;
  chart.render();
}

export function resetForexSceneState(): void {
  baseSceneApplied = false;
  resetForexNewsFeedState();
}

function applyRareDrawings(chart: ChartInstance, candles: Candle[], hit: StrategySignalHit | null): number {
  const focusIndex = hit?.barIndex ?? Math.floor(candles.length * 0.72);
  const start = Math.max(0, focusIndex - 6);
  const end = Math.min(candles.length - 1, focusIndex + 4);
  const startCandle = candles[start];
  const endCandle = candles[end];

  if (startCandle && endCandle) {
    collectSceneId(
      chart.toolDrawer.drawTool({
        id: "rare-box",
        type: "box",
        color: "#a855f7",
        fillBg: true,
        editable: false,
        anchors: [
          { stamp: startCandle.stamp, offset: 0, value: startCandle.l, _index: start },
          { stamp: endCandle.stamp, offset: 0, value: endCandle.h, _index: end },
        ],
      }),
    );

    collectSceneId(
      chart.toolDrawer.drawTool({
        id: "rare-text",
        type: "textAnnotation",
        color: "#e9d5ff",
        text: "52w vol percentile: 3%",
        fontSize: 12,
        editable: false,
        anchors: [
          { stamp: endCandle.stamp, offset: 0, value: endCandle.h, _index: end },
          {
            stamp: candles[Math.min(end + 4, candles.length - 1)]!.stamp,
            offset: 0,
            value: endCandle.h + (endCandle.h - endCandle.l) * 0.5,
            _index: Math.min(end + 4, candles.length - 1),
          },
        ],
      }),
    );
  }

  return focusIndex;
}

function applySignalPublisherCard(
  chart: ChartInstance,
  candles: Candle[],
  hit: StrategySignalHit,
): void {
  const candle = candles[hit.barIndex];
  if (!candle) {
    return;
  }

  const color = hit.side === "buy" ? "#22c55e" : "#ef4444";

  collectSceneId(
    chart.toolDrawer.drawTool({
      id: "signal-publisher-tag",
      type: "priceTag",
      color,
      editable: false,
      anchors: [
        { stamp: candle.stamp, offset: 0, value: candle.c, _index: hit.barIndex },
      ],
    }),
  );

  collectSceneId(
    chart.toolDrawer.drawTool({
      id: "signal-publisher-text",
      type: "textAnnotation",
      color: "#f8fafc",
      text: `${hit.label.toUpperCase()} · Confluence`,
      fontSize: 12,
      editable: false,
      anchors: [
        { stamp: candle.stamp, offset: 0, value: candle.h, _index: hit.barIndex },
        {
          stamp: candles[Math.min(hit.barIndex + 5, candles.length - 1)]!.stamp,
          offset: 0,
          value: candle.h + (candle.h - candle.l) * 0.35,
          _index: Math.min(hit.barIndex + 5, candles.length - 1),
        },
      ],
    }),
  );
}

function applyArbTag(chart: ChartInstance, candles: Candle[], edgePips: number): void {
  const tagIndex = Math.floor(candles.length * 0.55);
  const tagCandle = candles[tagIndex];
  if (!tagCandle) {
    return;
  }

  const sign = edgePips >= 0 ? "+" : "";
  collectSceneId(
    chart.toolDrawer.drawTool({
      id: "arb-tag",
      type: "priceTag",
      color: "#f59e0b",
      editable: false,
      anchors: [
        {
          stamp: tagCandle.stamp,
          offset: 0,
          value: tagCandle.c + PIP_SIZE * Math.abs(edgePips),
          _index: tagIndex,
        },
      ],
    }),
  );

  collectSceneId(
    chart.toolDrawer.drawTool({
      id: "arb-text",
      type: "textAnnotation",
      color: "#fde68a",
      text: `Implied vs quoted ${sign}${edgePips.toFixed(1)} pips`,
      fontSize: 12,
      editable: false,
      anchors: [
        { stamp: tagCandle.stamp, offset: 0, value: tagCandle.h, _index: tagIndex },
        {
          stamp: candles[Math.min(tagIndex + 6, candles.length - 1)]!.stamp,
          offset: 0,
          value: tagCandle.h + PIP_SIZE * 8,
          _index: Math.min(tagIndex + 6, candles.length - 1),
        },
      ],
    }),
  );
}

export async function applyOpportunityScene(
  chart: ChartInstance,
  opportunity: ForexOpportunity,
  candles: Candle[],
  options: {
    timeframeId: ForexTimeframeId;
    shouldFocusViewport?: boolean;
  },
): Promise<ApplySceneResult> {
  clearOpportunityDrawings(chart);

  const crossHit = findLastChartCrossMarker(chart);
  const exceedHit = findLastExceedHit(candles);
  let focusBarIndex: number | undefined;
  let arbSnapshot: ArbSnapshot | null = null;

  switch (opportunity.sceneKind) {
    case "arb": {
      if (opportunity.id === "arb-triangular") {
        arbSnapshot = await applyTriangularArbOverlay(chart, options.timeframeId);
        applyArbTag(chart, candles, arbSnapshot?.edgePips ?? 2.1);
      } else if (opportunity.overlaySymbol) {
        await applyCorrelationOverlay(chart, opportunity.overlaySymbol, options.timeframeId);
        applyArbTag(chart, candles, 1.6);
      }
      focusBarIndex = Math.floor(candles.length * 0.6);
      break;
    }
    case "rare": {
      focusBarIndex = applyRareDrawings(chart, candles, exceedHit);
      break;
    }
    case "signal": {
      const hit = crossHit ?? exceedHit;
      if (hit) {
        applySignalPublisherCard(chart, candles, hit);
        focusBarIndex = hit.barIndex;
      } else {
        focusBarIndex = Math.floor(candles.length * 0.75);
      }
      break;
    }
    case "news":
      focusBarIndex = undefined;
      break;
    default:
      break;
  }

  if (options.shouldFocusViewport && focusBarIndex !== undefined) {
    focusChartOnBar(chart, focusBarIndex);
  }

  chart.render();

  return {
    focusBarIndex,
    signalHit: crossHit ?? exceedHit,
    arbSnapshot,
  };
}
