import type { CoreChartModel, CoreChartPanel } from "./chart";
import type { CoreInteractor, PointerEventLike } from "./interactor";
import type { CoreRenderer } from "./renderer";
import type { FusionScriptControllerRuntime } from "./scripts";
import type { SeriesManager } from "./series";

export interface ChartPanelObject {
  id?: string | number;
  dataLink?: string;
  dataField?: string | null;
  type?: string;
  reference?: string | null;
  drag?: boolean;
  [key: string]: unknown;
}

export interface ChartRuntimeObject extends ChartPanelObject {
  id?: string | number;
  type: string;
  hidden?: boolean;
  permHide?: boolean;
  selected?: boolean;
  hover?: boolean;
  isBeingDragged?: boolean;
  renderAs?: string;
  color?: string;
  list?: ChartRuntimeObject[];
  object?: Record<string, unknown>;
  [key: string]: any;
}

export interface ChartObjectCollection {
  visible: boolean;
  selected?: boolean;
  list: ChartRuntimeObject[];
  [key: string]: any;
}

export type KnownRendererObjectType =
  | "SeriesObject"
  | "StrategyObject"
  | "CandlestickPatternStrategyObject"
  | "FractalsObject"
  | "IndicatorObject"
  | "TradeObject"
  | "StopLimitObject"
  | "POSITION"
  | "TP"
  | "SL"
  | "BUY LIMIT"
  | "BUY STOP"
  | "BUY STOP_LIMIT"
  | "SELL LIMIT"
  | "SELL STOP"
  | "SELL STOP_LIMIT"
  | "SELL TRAILING_STOP"
  | "BUY TRAILING_STOP"
  | "SELL TAKE_PROFIT"
  | "BUY TAKE_PROFIT"
  | "SELL TAKE_PROFIT_MARKET"
  | "BUY TAKE_PROFIT_MARKET"
  | "SELL TAKE_PROFIT_LIMIT"
  | "BUY TAKE_PROFIT_LIMIT"
  | "MovePaneArrows"
  | "trendLine"
  | "arrow"
  | "parallelChannel"
  | "fibonLines"
  | "hLine"
  | "vLine"
  | "mLine"
  | "abcd"
  | "ellipse"
  | "box"
  | "hRange"
  | "vRange"
  | "timeRange"
  | "timeBet"
  | "cycle"
  | "textAnnotation"
  | "triangle"
  | "priceTag"
  | "diNapoliLevels"
  | "diNapoliAbcd";

export interface RendererObjectExtremes {
  min: number;
  max: number;
  [key: string]: unknown;
}

export interface RendererObjectRenderContext {
  renderer: CoreRenderer;
  model: CoreChartModel;
  panel: CoreChartPanel | null;
  seriesManager: SeriesManager;
}

export interface RendererObjectInteractionContext extends RendererObjectRenderContext {
  interactor: CoreInteractor;
  object: ChartRuntimeObject;
  event: PointerEventLike;
}

export interface RendererObjectAnchorSelection {
  selected: number | null;
  anchors: Array<Record<string, unknown>>;
  drag?: boolean;
}

type RendererTargetObject = ChartRuntimeObject;
type BivariantMethod<Args extends unknown[], Result> = {
  bivarianceHack(...args: Args): Result;
}["bivarianceHack"];

export type RendererObjectRenderMethod = BivariantMethod<
  [
    object: RendererTargetObject,
    context: CanvasRenderingContext2D,
    renderer: CoreRenderer,
    model: CoreChartModel,
    panel: CoreChartPanel | null,
    seriesManager: SeriesManager,
  ],
  void
>;

export type RendererObjectUpdateExtremesMethod = BivariantMethod<
  [
    object: ChartRuntimeObject,
    extremes: RendererObjectExtremes,
    model: CoreChartModel,
    seriesManager: SeriesManager,
    panel: CoreChartPanel | null,
    renderer: CoreRenderer,
  ],
  void
>;

export type RendererObjectHitMethod = BivariantMethod<
  [
    x: number,
    y: number,
    object: ChartRuntimeObject,
    renderer: CoreRenderer,
    interactor: CoreInteractor,
    model: CoreChartModel,
    panel: CoreChartPanel | null,
    seriesManager: SeriesManager,
  ],
  unknown
>;

export type RendererObjectPushPopMethod = BivariantMethod<
  [
    object: ChartRuntimeObject,
    renderer: CoreRenderer,
    model: CoreChartModel,
    seriesManager: SeriesManager,
    interactor: CoreInteractor,
  ],
  void
>;

export type RendererObjectMouseHandler<TResult = void> = BivariantMethod<
  [
    event: PointerEventLike,
    object: ChartRuntimeObject,
    renderer: CoreRenderer,
    interactor: CoreInteractor,
    model: CoreChartModel,
    panel: CoreChartPanel | null,
    seriesManager: SeriesManager,
  ],
  TResult
>;

export type RendererObjectTooltipProvider = BivariantMethod<
  [
    object: ChartRuntimeObject,
    index: number,
    model: CoreChartModel,
    seriesManager: SeriesManager,
    scriptsManager: Record<string, FusionScriptControllerRuntime>,
  ],
  unknown
>;

export type RendererObjectClearHitsMethod = BivariantMethod<[object: ChartRuntimeObject], void>;

export interface CoreRendererObject {
  render: RendererObjectRenderMethod;
  postRender: RendererObjectRenderMethod;
  renderOverlay?: RendererObjectRenderMethod;
  postRenderOverlay?: RendererObjectRenderMethod;
  updateExtremes?: RendererObjectUpdateExtremesMethod;
  hit: RendererObjectHitMethod;
  clearHits?: RendererObjectClearHitsMethod;
  push?: RendererObjectPushPopMethod;
  pop?: RendererObjectPushPopMethod;
  mouseDown: RendererObjectMouseHandler<unknown>;
  mouseUp: RendererObjectMouseHandler;
  mouseMove?: RendererObjectMouseHandler;
  mouseOut: RendererObjectMouseHandler;
  mouseDrag: RendererObjectMouseHandler;
  stageDown?: RendererObjectMouseHandler<unknown>;
  stageUp?: RendererObjectMouseHandler<unknown>;
  stageMove?: RendererObjectMouseHandler;
  stageDrag?: RendererObjectMouseHandler;
  stageOut?: RendererObjectMouseHandler;
  getToolTip?: RendererObjectTooltipProvider;
  isDraggable?: boolean;
  [key: string]: any;
}

export interface RendererObjectsRegistry extends Record<string, CoreRendererObject> {
  SeriesObject: CoreRendererObject;
  StrategyObject: CoreRendererObject;
  CandlestickPatternStrategyObject: CoreRendererObject;
  FractalsObject: CoreRendererObject;
  IndicatorObject: CoreRendererObject;
  TradeObject: CoreRendererObject;
  StopLimitObject: CoreRendererObject;
  POSITION: CoreRendererObject;
  TP: CoreRendererObject;
  SL: CoreRendererObject;
  "BUY LIMIT": CoreRendererObject;
  "BUY STOP": CoreRendererObject;
  "BUY STOP_LIMIT": CoreRendererObject;
  "SELL LIMIT": CoreRendererObject;
  "SELL STOP": CoreRendererObject;
  "SELL STOP_LIMIT": CoreRendererObject;
  "SELL TRAILING_STOP": CoreRendererObject;
  "BUY TRAILING_STOP": CoreRendererObject;
  "SELL TAKE_PROFIT": CoreRendererObject;
  "BUY TAKE_PROFIT": CoreRendererObject;
  "SELL TAKE_PROFIT_MARKET": CoreRendererObject;
  "BUY TAKE_PROFIT_MARKET": CoreRendererObject;
  "SELL TAKE_PROFIT_LIMIT": CoreRendererObject;
  "BUY TAKE_PROFIT_LIMIT": CoreRendererObject;
  MovePaneArrows: CoreRendererObject;
  trendLine: CoreRendererObject;
  arrow: CoreRendererObject;
  parallelChannel: CoreRendererObject;
  fibonLines: CoreRendererObject;
  hLine: CoreRendererObject;
  vLine: CoreRendererObject;
  mLine: CoreRendererObject;
  abcd: CoreRendererObject;
  ellipse: CoreRendererObject;
  box: CoreRendererObject;
  hRange: CoreRendererObject;
  vRange: CoreRendererObject;
  timeRange: CoreRendererObject;
  timeBet: CoreRendererObject;
  cycle: CoreRendererObject;
  textAnnotation: CoreRendererObject;
  triangle: CoreRendererObject;
  priceTag: CoreRendererObject;
  diNapoliLevels: CoreRendererObject;
  diNapoliAbcd: CoreRendererObject;
}
