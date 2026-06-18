import type { Candle, ChartInstance } from "@efixdata/exeria-chart";
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
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
  ema.inputs.PERIODS.value = 21;
  await chart.addScript("EMA", ema);

    // @ts-ignore
  await chart.addScript("MACD");
    // @ts-ignore
  const macdLineRef = getSeriesReference(chart, "MACDLine");
    // @ts-ignore
  const macdSignalRef = getSeriesReference(chart, "MACDSignal");
    // @ts-ignore
  const cross = getScriptClone(chart, "CROSS");
    // @ts-ignore
  cross.inputs.LINE.value = macdLineRef;
    // @ts-ignore
  cross.inputs.SIGNAL.value = macdSignalRef;
    // @ts-ignore
  await chart.addScript("CROSS", cross);
    // @ts-ignore

    // @ts-ignore
  await chart.addScript("BBAND");
    // @ts-ignore
  const closeRef = getSeriesReference(chart, "c");
    // @ts-ignore
  const upperRef = getSeriesReference(chart, "BBUpper");
    // @ts-ignore
  const lowerRef = getSeriesReference(chart, "BBLower");
    // @ts-ignore
  const exceed = getScriptClone(chart, "EXCEED");
    // @ts-ignore
  exceed.inputs.UPPER.value = upperRef;
    // @ts-ignore
  exceed.inputs.LOWER.value = lowerRef;
    // @ts-ignore
  exceed.inputs.HIGH.value = closeRef;
    // @ts-ignore
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

    // @ts-ignore
export async function applyOpportunityScene(
  chart: ChartInstance,
  opportunity: ForexOpportunity,
  candles: Candle[],
  options: {
    // @ts-ignore
    timeframeId: ForexTimeframeId;
    // @ts-ignore
    shouldFocusViewport?: boolean;
  },
    // @ts-ignore
): Promise<ApplySceneResult> {
  clearOpportunityDrawings(chart);

  const crossHit = findLastChartCrossMarker(chart);
  const exceedHit = findLastExceedHit(candles);
    // @ts-ignore
  let focusBarIndex: number | undefined;
    // @ts-ignore
  let arbSnapshot: ArbSnapshot | null = null;

    // @ts-ignore
  switch (opportunity.sceneKind) {
    case "arb": {
      if (opportunity.id === "arb-triangular") {
        arbSnapshot = await applyTriangularArbOverlay(chart, options.timeframeId);
        applyArbTag(chart, candles, arbSnapshot?.edgePips ?? 2.1);
    // @ts-ignore
      } else if (opportunity.overlaySymbol) {
    // @ts-ignore
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
    // @ts-ignore
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
    // @ts-ignore
      break;
    default:
      break;
  }

  if (options.shouldFocusViewport && focusBarIndex !== undefined) {
    focusChartOnBar(chart, focusBarIndex);
  }

  chart.render();

    // @ts-ignore
  return {
    focusBarIndex,
    signalHit: crossHit ?? exceedHit,
    arbSnapshot,
  };
}
