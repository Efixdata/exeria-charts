import WEBRCP from "../../WebRCP";
import { Series } from "../../objectRuntimeBases";

declare const $: any;

type BaseSeriesRuntime = Omit<
  InstanceType<typeof Series>,
  | "getMenuItems"
  | "getRenderMode"
  | "render"
  | "postRender"
  | "drawSelectionLine"
  | "updateExtremes"
  | "getToolTip"
  | "hit"
  | "mouseDown"
  | "mouseDrag"
  | "mouseUp"
  | "mouseOut"
> &
  Record<string, any>;
type LegacyAnyMethod = (...args: any[]) => any;
type SeriesRuntime = BaseSeriesRuntime & {
  getMenuItems: LegacyAnyMethod;
  getRenderMode: LegacyAnyMethod;
  render: LegacyAnyMethod;
  renderOverlay: LegacyAnyMethod;
  postRender: LegacyAnyMethod;
  renderPriceTag: LegacyAnyMethod;
  renderAsHistogram: LegacyAnyMethod;
  renderAsVolumeHistogram: LegacyAnyMethod;
  renderAsBand: LegacyAnyMethod;
  drawSelectionLine: LegacyAnyMethod;
  drawHit: LegacyAnyMethod;
  getStartIndex: LegacyAnyMethod;
  getEndIndex: LegacyAnyMethod;
  renderAsLine: LegacyAnyMethod;
  renderAsOHLC: LegacyAnyMethod;
  renderAsBars: LegacyAnyMethod;
  renderAsChartShape: LegacyAnyMethod;
  renderPriceLine: LegacyAnyMethod;
  updateExtremes: LegacyAnyMethod;
  updateExtremesOHLC: LegacyAnyMethod;
  updateExtremesLine: LegacyAnyMethod;
  getToolTip: LegacyAnyMethod;
  hit: LegacyAnyMethod;
  isHitEmpty: LegacyAnyMethod;
  hitOHLC: LegacyAnyMethod;
  hitBars: LegacyAnyMethod;
  getLineHitResult: LegacyAnyMethod;
  hitLine: LegacyAnyMethod;
  hitHistogram: LegacyAnyMethod;
  hitVolumeHistogram: LegacyAnyMethod;
  hitBand: LegacyAnyMethod;
  getMin: LegacyAnyMethod;
  getMax: LegacyAnyMethod;
  getValuesY4StrategyValue: LegacyAnyMethod;
  getPointY4StrategyValue: LegacyAnyMethod;
  drawBuy: LegacyAnyMethod;
  drawSell: LegacyAnyMethod;
  drawExitAll: LegacyAnyMethod;
  mouseDown: LegacyAnyMethod;
  mouseDrag: LegacyAnyMethod;
  mouseUp: LegacyAnyMethod;
  mouseOut: LegacyAnyMethod;
  drawLine: LegacyAnyMethod;
  drawBar: LegacyAnyMethod;
  drawRect: LegacyAnyMethod;
  drawDragHandler: LegacyAnyMethod;
  drawRunnerMarker: LegacyAnyMethod;
  drawRelations: LegacyAnyMethod;
  drawTradeObject: LegacyAnyMethod;
  isDragHandlerAllowedForObject: LegacyAnyMethod;
  prepareRunnerMarker: LegacyAnyMethod;
  getTpForPosition: LegacyAnyMethod;
  getSlForPosition: LegacyAnyMethod;
  getTradeObjectById: LegacyAnyMethod;
  getDragPrice: LegacyAnyMethod;
  getReferenceValue: LegacyAnyMethod;
  getOperationTitle: LegacyAnyMethod;
  drawFieldBetweenTrades: LegacyAnyMethod;
  makeStopObject: LegacyAnyMethod;
  init?: LegacyAnyMethod;
  opts: Record<string, any>;
  settings: Record<string, any>;
  downRenderedValues: number[];
  upperRenderedValues: number[];
  relativeOffset?: { x: number; y: number } | null;
  tmpIndex?: any;
  tmpPoint?: any;
  tmpValue?: any;
};
export type PatternStrategyRuntime = SeriesRuntime & { candleChartImage: HTMLImageElement };
export type { SeriesRuntime, LegacyAnyMethod };

export function getScriptTitle(o: any, model: any, seriesManager: any, scriptManager: any) {
  function findRelatedScriptName(o: any, model: any, scriptManager: any) {
    var scriptInstance = null;

    for (var property in scriptManager) {
      if (scriptManager.hasOwnProperty(property)) {
        var script = scriptManager[property];
        var outputs = script.outputs;
        for (var output in outputs) {
          if (outputs.hasOwnProperty(output)) {
            if (outputs[output] == o.dataLink && o.dataLink) {
              scriptInstance = script;
              break;
            }
          }
        }
      }
    }

    if (scriptInstance) {
      for (var k in model.scripts) {
        if (model.scripts[k].id == scriptInstance.id) return model.scripts[k].userName;
      }
    }
    return null;
  }

  const userName = findRelatedScriptName(o, model, scriptManager);
  const name = seriesManager[o.dataLink].title;

  const title =
    userName && userName !== name
      ? WEBRCP.locale.fusion.getMessage(name, name) + " (" + userName + ")"
      : WEBRCP.locale.fusion.getMessage(name, name, true);
  return WEBRCP.locale.fusion.getMessage(title, title, true);
}
