import { Shape } from "../../objectRuntimeBases";
import type { LegacyShapeObject } from "../../objectRuntimeBases";
import type { LegacyAnchorSelection } from "../../objectRuntimeBases";
import type { CoreInteractor, OffsetPointerEvent } from "../../internal-types/interactor";
import type { LegacyShapePoint } from "../../objectRuntimeBases";
import type { ToolInteractionContext, ToolRenderContext } from "../../objectRuntimeBases";

export type ShapeToolColors = {
  toolColor: string;
  arrowColor: string;
};

export type ShapeTextConfig = {
  offsetX: number;
  offsetY: number;
  widthMin: number;
  widthMax: number;
  heightMin: number;
  margin: number;
  lineSpacing: number;
  lineHeight: number;
  lineMultiplier: number;
  fontSize: number;
};

type ShapeRuntimeState = {
  subscriptionPack?: string;
  cfg?: ShapeTextConfig;
  font?: string;
  lineHeight?: number;
  boxBeginningX?: number;
  lastClickStamp?: number;
  defaultTagLen?: number;
  defaultLineLen?: number;
  lineWidth?: number;
  margin?: number;
};

type BaseShapeRuntime = Omit<
  InstanceType<typeof Shape>,
  | "getPoints"
  | "push"
  | "pop"
  | "render"
  | "renderOverlay"
  | "hit"
  | "mouseDown"
  | "mouseUp"
  | "mouseOut"
  | "mouseDrag"
  | "stageDown"
  | "stageMove"
  | "stageUp"
  | "stageOut"
  | "stageDrag"
  | "postRender"
  | "postRenderOverlay"
> &
  ShapeRuntimeState;

export type ShapeRenderRuntimeContext = ToolRenderContext;
export type ShapeRendererContext = ShapeRenderRuntimeContext["renderer"];
export type ShapeModelContext = ShapeRenderRuntimeContext["model"];
export type ShapePanelContext = NonNullable<ShapeRenderRuntimeContext["panel"]>;
export type ShapeSeriesManagerContext = ShapeRenderRuntimeContext["seriesManager"];
export type ShapeInteractorContext = ToolInteractionContext["interactor"] & {
  currentAnchor: LegacyAnchorSelection;
  initialMouseEvent: OffsetPointerEvent;
};
export type ShapeInteractionRuntimeContext = Omit<
  ToolInteractionContext,
  "event" | "object" | "interactor" | "panel"
> & {
  event: OffsetPointerEvent;
  object: LegacyShapeObject;
  interactor: ShapeInteractorContext;
  panel: ShapePanelContext;
};
export type ShapeLifecycleRuntimeContext = Omit<
  ToolInteractionContext,
  "event" | "object" | "interactor" | "panel"
> & {
  event: OffsetPointerEvent;
  object: LegacyShapeObject;
  interactor: CoreInteractor;
  panel: ShapePanelContext;
};
export type ShapePointerEvent = ShapeInteractionRuntimeContext["event"];

export type ShapeAnchorOverlayOptions = {
  drawArrowHandles?: boolean;
  redrawAnchorsWhenSelected?: boolean;
};

export type ShapeMouseUpOptions = {
  popPanel?: boolean;
  requireHitArrow?: boolean;
};

export type ShapeRenderOverlayArgs = [
  object: LegacyShapeObject,
  overlayContext: CanvasRenderingContext2D,
  renderer: ShapeRenderRuntimeContext["renderer"],
  model: ShapeRenderRuntimeContext["model"],
  panel: ShapeRenderRuntimeContext["panel"] & ShapePanelContext,
  seriesManager: ShapeRenderRuntimeContext["seriesManager"],
];

export type ShapeRenderArgs = ShapeRenderOverlayArgs;

export type ShapeHitArgs = [
  x: number,
  y: number,
  object: LegacyShapeObject,
  renderer: ShapeInteractionRuntimeContext["renderer"],
  interactor: ShapeInteractionRuntimeContext["interactor"],
  model: ShapeInteractionRuntimeContext["model"],
  panel: ShapeInteractionRuntimeContext["panel"],
  seriesManager: ShapeInteractionRuntimeContext["seriesManager"],
];

export type ShapeInteractionArgs = [
  event: ShapeInteractionRuntimeContext["event"],
  object: ShapeInteractionRuntimeContext["object"],
  renderer: ShapeInteractionRuntimeContext["renderer"],
  interactor: ShapeInteractionRuntimeContext["interactor"],
  model: ShapeInteractionRuntimeContext["model"],
  panel: ShapeInteractionRuntimeContext["panel"],
  seriesManager: ShapeInteractionRuntimeContext["seriesManager"],
];

export type ShapeLifecycleArgs = [
  event: ShapeLifecycleRuntimeContext["event"],
  object: ShapeLifecycleRuntimeContext["object"],
  renderer: ShapeLifecycleRuntimeContext["renderer"],
  interactor: ShapeLifecycleRuntimeContext["interactor"],
  model: ShapeLifecycleRuntimeContext["model"],
  panel: ShapeLifecycleRuntimeContext["panel"],
  seriesManager: ShapeLifecycleRuntimeContext["seriesManager"],
];

export type ShapeGetPointsMethod = (
  object: LegacyShapeObject,
  renderer: ShapeRendererContext,
  panel: ShapePanelContext | null | undefined,
  model: ShapeModelContext,
  seriesManager: ShapeSeriesManagerContext,
) => LegacyShapePoint[];

export type ShapePushMethod = (
  object: LegacyShapeObject,
  renderer: ShapeRendererContext,
  model: ShapeModelContext,
  seriesManager: ShapeSeriesManagerContext,
) => void;

export type ShapePopMethod = (
  object: LegacyShapeObject,
  renderer: ShapeRendererContext,
  model: ShapeModelContext,
  seriesManager: ShapeSeriesManagerContext,
  interactor: ShapeInteractorContext,
) => void;

export type ShapeRenderMethod = (...args: ShapeRenderArgs) => void;
export type ShapeHitMethod = (...args: ShapeHitArgs) => boolean | LegacyShapeObject["_hit"];
export type ShapeInteractionMethod = (...args: ShapeInteractionArgs) => void;
export type ShapeGetColorsMethod = (
  object: LegacyShapeObject,
  isWinning: boolean,
) => ShapeToolColors;
export type ShapeIsWinningMethod = (
  object: LegacyShapeObject,
  model: ShapeModelContext,
  seriesManager: ShapeSeriesManagerContext,
) => boolean;
export type ShapeDrawPointMethod = (
  context: CanvasRenderingContext2D,
  points: LegacyShapePoint[],
  index: number,
  price: string,
) => void;
export type ShapeGetIndexNameMethod = (index: number) => string;
export type ShapeDrawLevelsMethod = (
  index: number,
  points: LegacyShapePoint[],
  object: LegacyShapeObject,
  context: CanvasRenderingContext2D,
  renderer: ShapeRendererContext,
  model: ShapeModelContext,
  panel: ShapePanelContext,
  seriesManager: ShapeSeriesManagerContext,
) => void;
export type ShapeDrawLevelPointsMethod = (
  points: LegacyShapePoint[],
  object: LegacyShapeObject,
  context: CanvasRenderingContext2D,
  renderer: ShapeRendererContext,
  model: ShapeModelContext,
  panel: ShapePanelContext,
  seriesManager: ShapeSeriesManagerContext,
) => void;
export type ShapeHighestDifferenceMethod = (
  rootPoint: LegacyShapePoint,
  point: LegacyShapePoint,
  model: ShapeModelContext,
  seriesManager: ShapeSeriesManagerContext,
) => boolean;
export type ShapePrecisionMethod = (model: ShapeModelContext) => number;
export type ShapeValueColorMethod = (value: number) => string;
export type ShapeValueNameMethod = (value: number) => string;
export type ShapeMouseDownMethod =
  | ((...args: ShapeInteractionArgs) => unknown)
  | ((...args: ShapeLifecycleArgs) => unknown);

export type ShapeLifecycleMethod =
  | ((...args: ShapeInteractionArgs) => unknown)
  | ((...args: ShapeLifecycleArgs) => unknown);

export type ShapeBaseMouseDownDelegate =
  | "mouseDown"
  | "mouseDownWithPanelPush"
  | "mouseDownWithExpandableArrowSelection";

export type ShapeBaseMouseOutDelegate = "mouseOut" | "mouseOutKeepHits";

export type ShapeConstructor = new () => ShapeRuntime;

export type ShapeRuntime = BaseShapeRuntime & {
  getPoints: ShapeGetPointsMethod;
  push: ShapePushMethod;
  pop: ShapePopMethod;
  postRender: ShapeRenderMethod;
  postRenderOverlay: ShapeRenderMethod;
  getColors: ShapeGetColorsMethod;
  isWinning: ShapeIsWinningMethod;
  render: ShapeRenderMethod;
  renderOverlay: ShapeRenderMethod;
  hit: ShapeHitMethod;
  mouseDown: ShapeMouseDownMethod;
  mouseUp: ShapeLifecycleMethod;
  mouseOut: ShapeLifecycleMethod;
  mouseDrag: ShapeInteractionMethod;
  stageUp: ShapeLifecycleMethod;
  stageOut: ShapeLifecycleMethod;
  stageDrag: ShapeInteractionMethod;
  stageDown: ShapeLifecycleMethod;
  stageMove: ShapeInteractionMethod;
  drawPoint: ShapeDrawPointMethod;
  getIndexName: ShapeGetIndexNameMethod;
  drawLevels: ShapeDrawLevelsMethod;
  isHighestDifference: ShapeHighestDifferenceMethod;
  drawLevelPoints: ShapeDrawLevelPointsMethod;
  getPrecision: ShapePrecisionMethod;
  getValueColor: ShapeValueColorMethod;
  getValueName: ShapeValueNameMethod;
};
export type ShapeTagRuntime = ShapeRuntime & { defaultTagLen: number; defaultLineLen: number };
