import WEBRCP from "../../WebRCP";
import { Series } from "../../objectRuntimeBases";
import type { LegacySeriesObject } from "../../objectRuntimeBases";
import type { CoreChartModel, CoreChartPanel } from "../../internal-types/chart";
import type { CoreInteractor, PointerEventLike } from "../../internal-types/interactor";
import type { CoreRenderer } from "../../internal-types/renderer";
import type { ScriptModelConfig } from "../../internal-types/scripts";
import type { FusionSeriesManager } from "../../internal-types/series";

export type MovePaneArrowOptions = {
  color: string;
  alpha: number;
  width: number;
  height: number;
  offsetY: number;
  offsetX: number;
  spacing: number;
};

export type TradeObjectSettings = {
  bar: {
    x: number;
    w: number;
    h: number;
    color: string;
    text_color: string;
    spacing: number;
    closeBtn: {
      x: number;
      w: number;
    };
    dragTpSlHandler: {
      x: number;
      w: number;
    };
  };
  line: {
    w: number;
    color: string;
    dash?: number[];
  };
  connections: {
    w: number;
    color: string;
  };
  runnerMarker: {
    x: number;
    w: number;
    activeBg: string;
    color: string;
  };
  relatedBar: {
    color: string;
    alpha: number;
  };
};

export type SeriesPriceLineOptions = {
  ctx: CanvasRenderingContext2D;
  panel: SeriesPanelContext;
  model: SeriesModelContext;
  y: number;
  value: number;
  green?: string;
  red?: string;
  open?: number;
};

export type SeriesStrategyValueRange = {
  up: number;
  dn: number;
};

export type TradeRunnerMarker = {
  bg: string;
  color: string;
  text: string;
};

export type SeriesTradeObject = LegacySeriesObject & {
  id?: string | number;
  parentId?: string | number;
  price: number;
  stopPrice?: number;
  limitPrice?: number;
  operation?: string;
  title: string;
  type: string;
  hidden?: boolean;
  drag?: boolean;
  stop?: boolean;
  hitStop?: boolean;
  modified?: boolean;
  modifyAllowed?: boolean;
  relatedAllowed?: boolean;
  related?: SeriesTradeObject | null;
  priceConnections?: number[];
  _hitCloseButton?: boolean | null;
  _hitDragHandler?: boolean | null;
  object: {
    price?: number;
    stopPrice?: number;
    limitPrice?: number;
    classification?: string;
    instrument?: {
      type?: string;
    };
    runner?: {
      name?: string;
    };
    portfolio?: {
      name?: string;
    };
    [key: string]: unknown;
  };
};

export type SeriesStopLimitObject = SeriesTradeObject & {
  stopPrice: number;
  limitPrice: number;
  operation: string;
  object: SeriesTradeObject["object"] & {
    stopPrice: number;
    limitPrice: number;
  };
};

export type SeriesScriptRuntime = {
  id?: string | number;
  outputs: Record<string, string | undefined>;
};

export type SeriesScriptManagerContext = Record<string, SeriesScriptRuntime>;

export type SeriesTooltipValue = {
  label: string;
  value: unknown;
  precision?: unknown;
};

export type SeriesTooltipData = {
  title: string;
  stamp?: string | number;
  values: SeriesTooltipValue[];
};

export type SeriesDataPoint = Record<string, unknown> & {
  [key: string]: any;
  stamp?: string | number;
  strength?: number | string;
  tooltips?: Record<string, unknown>;
};

export type SeriesLinkedObject = SeriesMenuObject & {
  dataLink: string;
};

export type SeriesFieldObject = SeriesLinkedObject & {
  dataField: string;
};

export type SeriesBandObject = SeriesFieldObject & {
  upperField: string;
  lowerField: string;
};

export type SeriesOhlcObject = SeriesFieldObject & {
  highDataField?: string;
  lowDataField?: string;
  openDataField?: string;
  closeDataField?: string;
};

export type SeriesHitPointObject = SeriesLinkedObject & {
  _hit: Exclude<LegacySeriesObject["_hit"], boolean | null | undefined>;
  dataField?: string;
  upperField?: string;
  lowerField?: string;
  openDataField?: string;
  closeDataField?: string;
};

export type SeriesExtremes = {
  min: number;
  max: number;
  [key: string]: any;
};

type SeriesRuntimeState = {
  hitTolerance?: number;
  opts: MovePaneArrowOptions;
  settings?: TradeObjectSettings;
  downRenderedValues: number[];
  upperRenderedValues: number[];
  relativeOffset?: { x: number; y: number } | null;
  tmpIndex: number;
  tmpPoint: number;
  tmpValue: number | string;
};

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
  SeriesRuntimeState;

export type SeriesRendererContext = CoreRenderer;
export type SeriesModelContext = CoreChartModel;
export type SeriesPanelContext = CoreChartPanel;
export type SeriesManagerContext = FusionSeriesManager;
export type SeriesInteractorContext = CoreInteractor;
export type SeriesPointerEvent = PointerEventLike;

export type SeriesRenderMode =
  | "OHLC"
  | "Line"
  | "Line and Histogram"
  | "Histogram"
  | "Bars"
  | "Band"
  | "Volume Histogram"
  | "ChartShape";

export type SeriesMenuSelectableRenderMode = Exclude<
  SeriesRenderMode,
  "Band" | "Volume Histogram" | "ChartShape"
>;

export type SeriesMenuObject = LegacySeriesObject & {
  renderAs?: string;
  dataLink?: string;
  color?: string;
  priceTag?: boolean;
  priceLine?: boolean;
};

export type SeriesMenuIconCallback = (
  $element: unknown,
  key: unknown,
  item: unknown
) => string;

export type SeriesMenuCallback = (key: unknown, options: unknown) => boolean;

export type SeriesMenuItem = {
  name: string;
  icon: SeriesMenuIconCallback;
  callback: SeriesMenuCallback;
};

export type SeriesMenuItems = Record<string, SeriesMenuItem | string>;

export type SeriesMenuOption = {
  key: string;
  mode: SeriesMenuSelectableRenderMode;
  labelKey: string;
  fallback?: string;
};

export type SeriesMenuToggle<TObject extends SeriesMenuObject = SeriesMenuObject> = {
  key: string;
  labelKey: string;
  fallback?: string;
  isChecked: (object: TObject) => boolean;
  toggle: (object: TObject) => void;
};

export type SeriesMenuChart = {
  options: {
    locale: {
      getMessage: (key: string, defaultMessage?: string) => string;
    };
  };
  onDrawModeSelected?: (payload: {
    type: SeriesMenuSelectableRenderMode;
    object: SeriesMenuObject;
    selected: boolean;
  }) => void;
};

export function isSeriesHitPoint(
  hit: LegacySeriesObject["_hit"],
): hit is Exclude<LegacySeriesObject["_hit"], boolean | null | undefined> {
  return !!hit && typeof hit === "object" && "x" in hit && "y" in hit;
}

export type SeriesRenderArgs<TObject extends LegacySeriesObject = LegacySeriesObject> = [
  object: TObject,
  context: CanvasRenderingContext2D,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
];

export type SeriesHitArgs<TObject extends LegacySeriesObject = LegacySeriesObject> = [
  x: number,
  y: number,
  object: TObject,
  renderer: SeriesRendererContext,
  interactor: SeriesInteractorContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
];

export type SeriesInteractionArgs<TObject extends LegacySeriesObject = LegacySeriesObject> = [
  event: SeriesPointerEvent,
  object: TObject,
  renderer: SeriesRendererContext,
  interactor: SeriesInteractorContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
];

export type SeriesUpdateExtremesArgs<TObject extends LegacySeriesObject = LegacySeriesObject> = [
  object: TObject,
  extremes: SeriesExtremes,
  model: SeriesModelContext,
  seriesManager: SeriesManagerContext,
];

export type SeriesMenuItemsMethod<TObject extends SeriesMenuObject = SeriesMenuObject> = (
  object: TObject,
  chart: SeriesMenuChart,
) => SeriesMenuItems | null | undefined;

export type SeriesRenderMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  ...args: SeriesRenderArgs<TObject>
) => void;

export type SeriesHitMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  ...args: SeriesHitArgs<TObject>
) => unknown;

export type SeriesBooleanHitMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  ...args: SeriesHitArgs<TObject>
) => boolean;

export type SeriesInteractionMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  ...args: SeriesInteractionArgs<TObject>
) => void;

export type SeriesExtendedRenderMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  object: TObject,
  context: CanvasRenderingContext2D,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
  forceField?: string,
) => boolean | void;

export type SeriesOverlayMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  object: TObject,
  context: CanvasRenderingContext2D,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
  forceField?: string,
) => void;

export type SeriesIndexFinderMethod = (
  index: number,
  data: SeriesDataPoint[],
  field: string,
) => number;

export type SeriesPriceLineMethod = (options: SeriesPriceLineOptions) => void;

export type SeriesUpdateExtremesMethod<
  TObject extends LegacySeriesObject = LegacySeriesObject,
> = (...args: SeriesUpdateExtremesArgs<TObject>) => void;

export type SeriesTooltipMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  object: TObject,
  index: number,
  model: SeriesModelContext,
  seriesManager: SeriesManagerContext,
  scriptManager: SeriesScriptManagerContext,
) => SeriesTooltipData | null | undefined;

export type SeriesLineHitResultMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  x: number,
  y: number,
  object: TObject,
  renderer: SeriesRendererContext,
  interactor: SeriesInteractorContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
  dataField: string,
) => boolean;

export type SeriesMinMaxMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  index: number,
  object: TObject,
  seriesManager: SeriesManagerContext,
) => number;

export type SeriesStrategyValueMethod<TObject extends LegacySeriesObject = LegacySeriesObject> = (
  object: TObject,
  index: number,
  strategyValue: number,
  panel: SeriesPanelContext,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  seriesManager: SeriesManagerContext,
) => SeriesStrategyValueRange;

export type SeriesSignalDrawMethod = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  position?: "up" | "down",
) => void;

export type TradeObjectRenderMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  ...args: SeriesRenderArgs<TObject>
) => void;

export type TradePriceLookupMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  object: TObject,
  model: SeriesModelContext,
) => SeriesTradeObject | null | undefined;

export type TradeObjectByIdMethod = (
  id: string | number | null | undefined,
  model: SeriesModelContext,
) => SeriesTradeObject | null | undefined;

export type TradePrepareRunnerMarkerMethod<
  TObject extends SeriesTradeObject = SeriesTradeObject,
> = (object: TObject) => TradeRunnerMarker | null;

export type TradeGetPriceMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  ...args: SeriesInteractionArgs<TObject>
) => number;

export type TradeGetReferenceValueMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  ...args: SeriesInteractionArgs<TObject>
) => unknown;

export type TradeDrawLineMethod = (
  x: number,
  y: number,
  width: number,
  color: string,
  context: CanvasRenderingContext2D,
) => void;

export type TradeDrawBarMethod = (
  title: string,
  y: number,
  color: string,
  context: CanvasRenderingContext2D,
) => void;

export type TradeDrawRectMethod = (
  startY: number,
  endY: number,
  context: CanvasRenderingContext2D,
  color: string,
) => void;

export type TradeDrawDragHandlerMethod = (
  y: number,
  context: CanvasRenderingContext2D,
) => void;

export type TradeDrawRunnerMarkerMethod = (
  y: number,
  context: CanvasRenderingContext2D,
  marker: TradeRunnerMarker,
) => void;

export type TradeDrawRelationsMethod = (
  y: number,
  y1: number | null,
  y2: number | null,
  context: CanvasRenderingContext2D,
  renderer: SeriesRendererContext,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
) => void;

export type TradeFieldBetweenTradesMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  object: TObject,
  context: CanvasRenderingContext2D,
  model: SeriesModelContext,
  panel: SeriesPanelContext,
  seriesManager: SeriesManagerContext,
  renderer: SeriesRendererContext,
) => void;

export type TradeStopObjectFactoryMethod<TObject extends SeriesTradeObject = SeriesTradeObject> = (
  object: TObject,
) => TObject;

export type TradeOperationTitleMethod = (operation: string) => string;

export type TradeDragHandlerAllowedMethod<
  TObject extends SeriesTradeObject = SeriesTradeObject,
> = (object: TObject, model: SeriesModelContext) => boolean;

export type SeriesInitMethod = () => void;


export type SeriesPriceTagConfig<TObject extends SeriesMenuObject = SeriesMenuObject> = {
  getRenderMode: (object: TObject, model: SeriesModelContext) => string;
  lineModes: readonly string[];
  ohlcModes: readonly string[];
  getBaseColor: (object: TObject) => string | undefined;
  getTextColor: (object: TObject, color: string | undefined) => string;
  getUpColor: (object: TObject) => string;
  getDownColor: (object: TObject) => string;
};

export type SeriesMenuConfig<TObject extends SeriesMenuObject = SeriesMenuObject> = {
  renderModes: readonly SeriesMenuOption[];
  selectRenderMode: (
    mode: SeriesMenuSelectableRenderMode,
    object: TObject,
    chart: SeriesMenuChart
  ) => void;
  toggles?: readonly SeriesMenuToggle<TObject>[];
};

export type RuntimeObjectConstructor<TInstance, TArgs extends unknown[] = []> = new (
  ...args: TArgs
) => TInstance;

type SeriesRuntime = BaseSeriesRuntime & {
  getMenuItems: SeriesMenuItemsMethod;
  getRenderMode: (object: LegacySeriesObject, model: SeriesModelContext) => string;
  render: SeriesRenderMethod;
  renderOverlay: SeriesRenderMethod;
  postRender: SeriesRenderMethod;
  renderPriceTag: SeriesRenderMethod;
  renderAsHistogram: SeriesRenderMethod;
  renderAsVolumeHistogram: SeriesRenderMethod;
  renderAsBand: SeriesRenderMethod;
  drawSelectionLine: SeriesExtendedRenderMethod;
  drawHit: SeriesOverlayMethod;
  getStartIndex: SeriesIndexFinderMethod;
  getEndIndex: SeriesIndexFinderMethod;
  renderAsLine: SeriesExtendedRenderMethod;
  renderAsOHLC: SeriesRenderMethod;
  renderAsBars: SeriesRenderMethod;
  renderAsChartShape: SeriesExtendedRenderMethod;
  renderPriceLine: SeriesPriceLineMethod;
  updateExtremes: SeriesUpdateExtremesMethod;
  updateExtremesOHLC: SeriesUpdateExtremesMethod;
  updateExtremesLine: SeriesUpdateExtremesMethod;
  getToolTip: SeriesTooltipMethod;
  hit: SeriesHitMethod;
  isHitEmpty: SeriesBooleanHitMethod;
  hitOHLC: SeriesBooleanHitMethod;
  hitBars: SeriesBooleanHitMethod;
  getLineHitResult: SeriesLineHitResultMethod;
  hitLine: SeriesBooleanHitMethod;
  hitHistogram: SeriesBooleanHitMethod;
  hitVolumeHistogram: SeriesBooleanHitMethod;
  hitBand: SeriesBooleanHitMethod;
  getMin: SeriesMinMaxMethod;
  getMax: SeriesMinMaxMethod;
  getValuesY4StrategyValue: SeriesStrategyValueMethod;
  getPointY4StrategyValue: SeriesStrategyValueMethod;
  drawBuy: SeriesSignalDrawMethod;
  drawSell: SeriesSignalDrawMethod;
  drawExitAll: SeriesSignalDrawMethod;
  mouseDown: SeriesInteractionMethod;
  mouseDrag: SeriesInteractionMethod;
  mouseUp: SeriesInteractionMethod;
  mouseOut: SeriesInteractionMethod;
  drawLine: TradeDrawLineMethod;
  drawBar: TradeDrawBarMethod;
  drawRect: TradeDrawRectMethod;
  drawDragHandler: TradeDrawDragHandlerMethod;
  drawRunnerMarker: TradeDrawRunnerMarkerMethod;
  drawRelations: TradeDrawRelationsMethod;
  drawTradeObject: TradeObjectRenderMethod;
  isDragHandlerAllowedForObject: TradeDragHandlerAllowedMethod;
  prepareRunnerMarker: TradePrepareRunnerMarkerMethod;
  getTpForPosition: TradePriceLookupMethod;
  getSlForPosition: TradePriceLookupMethod;
  getTradeObjectById: TradeObjectByIdMethod;
  getDragPrice: TradeGetPriceMethod;
  getReferenceValue: TradeGetReferenceValueMethod;
  getOperationTitle: TradeOperationTitleMethod;
  drawFieldBetweenTrades: TradeFieldBetweenTradesMethod;
  makeStopObject: TradeStopObjectFactoryMethod;
  init?: SeriesInitMethod;
};
export type PatternStrategyRuntime = SeriesRuntime & { candleChartImage: HTMLImageElement };
export type { SeriesRuntime };

export function getScriptTitle(
  o: LegacySeriesObject & { dataLink?: string },
  model: SeriesModelContext,
  seriesManager: SeriesManagerContext,
  scriptManager: SeriesScriptManagerContext,
) {
  function findRelatedScriptName(
    object: LegacySeriesObject & { dataLink?: string },
    currentModel: SeriesModelContext,
    runtimeScripts: SeriesScriptManagerContext,
  ) {
    let scriptInstance: SeriesScriptRuntime | null = null;

    for (const property in runtimeScripts) {
      if (Object.prototype.hasOwnProperty.call(runtimeScripts, property)) {
        const script = runtimeScripts[property];
        var outputs = script.outputs;
        for (const output in outputs) {
          if (Object.prototype.hasOwnProperty.call(outputs, output)) {
            if (outputs[output] == object.dataLink && object.dataLink) {
              scriptInstance = script;
              break;
            }
          }
        }
      }
    }

    if (scriptInstance) {
      for (const k in currentModel.scripts) {
        const scriptConfig = currentModel.scripts[k] as ScriptModelConfig & { userName?: unknown };
        if (scriptConfig.id == scriptInstance.id && typeof scriptConfig.userName === "string") {
          return scriptConfig.userName;
        }
      }
    }
    return null;
  }

  const userName = findRelatedScriptName(o, model, scriptManager);
  if (!o.dataLink || !seriesManager[o.dataLink]) return "";

  const name = seriesManager[o.dataLink].title;

  const title =
    userName && userName !== name
      ? WEBRCP.locale.fusion.getMessage(name, name) + " (" + userName + ")"
      : WEBRCP.locale.fusion.getMessage(name, name, true);
  return WEBRCP.locale.fusion.getMessage(title, title, true);
}
