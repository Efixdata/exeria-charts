import type { ArbSignalRecord, Candle, ChartInstance } from "@exeria/charts";
import type { ValueAxisMode } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { clearForexChartScripts } from "./forexChartReload";
import { applyArbSceneScripts } from "./applyArbSceneScripts";
import {
  clearAllForexOverlays,
  clearTriangularArbOverlay,
  type ArbSnapshot,
} from "./forexArbOverlay";
import { applySceneOverlays } from "./forexArbOverlay";
import { applyInstrumentLineStyle } from "./forexInstrumentLineStyle";
import { findForexTimeframe, type ForexTimeframeId } from "./forexInstruments";
import { focusChartOnBar } from "./chartBarPosition";
import {
  buildSceneDrawToolConfig,
  minimumAnchorsForDrawing,
} from "./buildSceneDrawToolConfig";
import { resolveSceneAnchor, resolveSceneFocusBarIndex } from "./resolveSceneFocus";

const sceneDrawingIds: Array<string | number> = [];

function clearInstrumentRenderLegendFlags(chart: ChartInstance): void {
  const host = chart as ChartInstance & {
    model: {
      mainSeries: string;
      instrumentsSeries: Array<{ seriesId: string }>;
      panels: Array<{
        objects: Array<{ dataLink?: string; renderLegend?: boolean }>;
      }>;
    };
  };

  const instrumentIds = new Set(
    host.model.instrumentsSeries.map((entry) => entry.seriesId),
  );

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      if (object.dataLink && instrumentIds.has(object.dataLink)) {
        delete object.renderLegend;
      }
    }
  }
}

export type ApplyArbSignalSceneResult = {
  focusBarIndex?: number | undefined;
  arbSnapshot?: ArbSnapshot | null;
};

function collectSceneId(result: string | number | void): void {
  if (result !== undefined && result !== null) {
    sceneDrawingIds.push(result);
  }
}

export function clearArbSignalDrawings(chart: ChartInstance): void {
  clearTriangularArbOverlay(chart);

  while (sceneDrawingIds.length > 0) {
    const id = sceneDrawingIds.pop();
    if (id !== undefined) {
      chart.toolDrawer.deleteTool(id);
    }
  }

  chart.render();
}

export async function applyArbSignalScene(
  chart: ChartInstance,
  signal: ArbSignalRecord,
  candles: Candle[],
  options?: { shouldFocusViewport?: boolean },
): Promise<ApplyArbSignalSceneResult> {
  clearArbSignalDrawings(chart);
  clearAllForexOverlays(chart);

  await clearForexChartScripts(chart);

  const scene = signal.chartScene;
  const timeframeId = scene.timeframe as ForexTimeframeId;
  const focusBarIndex =
    resolveSceneFocusBarIndex(candles, scene.focus, signal.detectedAt) ?? undefined;

  chart.setMainDrawMode(scene.mainDrawMode ?? "OHLC");
  chart.setValueAxisMode((scene.valueAxisMode ?? "lin") as ValueAxisMode);
  clearInstrumentRenderLegendFlags(chart);

  if (scene.mainDrawMode === "Line") {
    const host = chart as ChartInstance & { model: { mainSeries: string } };
    applyInstrumentLineStyle(chart, host.model.mainSeries, {
      lineColor: scene.mainInstrumentColor ?? "#38bdf8",
      lineFillMode: scene.mainLineFillMode ?? "gradient",
      fillOpacity: scene.mainLineFillOpacity ?? 0.28,
    });
  }

  await applyArbSceneScripts(chart, scene.scripts ?? []);

  if (scene.overlays?.length) {
    await applySceneOverlays(chart, scene.overlays, timeframeId);
  }

  for (const drawing of scene.drawings ?? []) {
    if (focusBarIndex === undefined) {
      continue;
    }

    const anchors = drawing.anchors
      .map((anchor) =>
        resolveSceneAnchor(candles, anchor, focusBarIndex, signal.detectedAt),
      )
      .filter((anchor): anchor is NonNullable<typeof anchor> => anchor !== null);

    const requiredAnchors = minimumAnchorsForDrawing(drawing.type);
    if (anchors.length < requiredAnchors) {
      continue;
    }

    collectSceneId(
      chart.toolDrawer.drawTool(buildSceneDrawToolConfig(drawing, anchors)),
    );
  }

  const legendSettings = chart.getChartLegendSettings?.();
  if (legendSettings) {
    chart.applyChartLegendSettings?.(legendSettings);
  }

  if (options?.shouldFocusViewport && focusBarIndex !== undefined) {
    focusChartOnBar(chart, focusBarIndex, {
      plotCenterRatio: scene.focus.plotCenterRatio ?? 0.5,
    });
  }

  pruneEmptyPanels(chart);
  chart.render();

  const arbSnapshot: ArbSnapshot | null = signal.arbMetrics
    ? {
        impliedEurGbp: signal.arbMetrics.impliedEurGbp ?? 0,
        quotedEurGbp: signal.arbMetrics.quotedEurGbp ?? 0,
        edgePips: signal.arbMetrics.edgePips,
      }
    : null;

  return {
    focusBarIndex,
    arbSnapshot: signal.category === "arb" ? arbSnapshot : null,
  };
}

export function getArbSignalTimeframe(signal: ArbSignalRecord): ForexTimeframeId {
  const tf = findForexTimeframe(signal.chartScene.timeframe);
  return tf.id;
}
