import type { ChartConfig } from "../types";
import type { CoreChartController, CoreChartModel, CoreChartPanel } from "./chart";
import type { CoreFusionRuntime } from "./fusion";
import type { ChartRuntimeObject } from "./objects";
import type { CoreRenderer } from "./renderer";
import type { RuntimeScriptConfig } from "./scripts";
import type { UnknownFn } from "./shared";
import type { LegacyAnchorSelection } from "../objectRuntimeBases";

export interface InteractorChartHost extends HTMLDivElement {
  options: {
    locale: {
      getMessage(key: string, fallback?: string): string;
    };
    doClosePositionCallback: (payload: unknown) => void;
    doDeleteOrderCallback: (payload: unknown) => void;
    doModifyOrderCallback: (payload: unknown) => void;
    doAddRelatedOrder: (payload: unknown) => void;
    openAddSLWidget: (payload: unknown) => void;
    openAddTPWidget: (payload: unknown) => void;
  };
  canvas: HTMLCanvasElement;
  model: CoreChartModel;
  fusion: CoreFusionRuntime;
  topLayer: ArrayLike<Element & { getBoundingClientRect(): DOMRect }>;
  repaint(): void;
  fit(): void;
  setLeftRightIndex(leftIndex: number, rightIndex: number): void;
  getObjectsForIndicator(): unknown;
  onScriptEditorApply(config: RuntimeScriptConfig): void;
  detachObject(objectId?: string | number): void;
  requestObjectText(
    object: ChartRuntimeObject,
    key: string,
    value: unknown,
    title?: string
  ): void;
  getLocaleMessages?(): {
    getMessage(key: string | null | undefined, defaultMsg?: unknown, emptyAllowed?: boolean): unknown;
  };
  objectsManager?: {
    cloneObject(object: ChartRuntimeObject): ChartRuntimeObject;
  };
}

export interface InteractorPinchState {
  trackedIndex: number | null;
  leftGrabbedIndex: number | null;
  rightGrabbedIndex: number | null;
}

export interface InteractorSwipeState {
  configuration: {
    velocity: {
      multiplier: number;
      minValue: number;
      trigger: number;
      dampingFactor: number;
    };
  };
  hook: ReturnType<typeof setInterval> | null;
}

export type InteractionModePointerHandler = (event: PointerEventLike) => void;
export type InteractionModeKeyHandler = (key: string) => void;
export type InteractionModeRenderHandler = (
  context: CanvasRenderingContext2D,
  startEvent?: PointerEventLike | null,
  finishEvent?: PointerEventLike | null
) => void;
export type InteractionModeRenderUpHandler = (
  context: CanvasRenderingContext2D,
  event: PointerEventLike
) => void;
export type InteractionModeRenderDnHandler = (
  context: CanvasRenderingContext2D,
  startEvent: PointerEventLike,
  finishEvent: PointerEventLike
) => void;
export type InteractionModeClonePredicate = (
  object: ChartRuntimeObject | null | undefined
) => boolean;

export interface CoreInteractionMode {
  symbol?: string;
  allowSwipe?: boolean;
  cursor?: string;
  cursorOverObject?: string;
  cursorOnDrag?: string;
  cursorOnCopyMode?: string;
  startEvent?: PointerEventLike | null;
  finishEvent?: PointerEventLike | null;
  onMouseDown: InteractionModePointerHandler;
  onMouseUp: InteractionModePointerHandler;
  onMouseMove: InteractionModePointerHandler;
  onMouseDrag: InteractionModePointerHandler;
  onRightMouseDrag: InteractionModePointerHandler;
  onMouseOut: InteractionModePointerHandler;
  keyDown: InteractionModeKeyHandler;
  render: InteractionModeRenderHandler;
  renderOverlay: InteractionModeRenderHandler;
  renderUp?: InteractionModeRenderUpHandler;
  renderDn?: InteractionModeRenderDnHandler;
  canBeCloned?: InteractionModeClonePredicate;
  onCancel?: () => void;
  [key: string]: any;
}

export interface PointerEventLike {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  offsetX?: number;
  offsetY?: number;
  which?: number;
  button?: number;
  deltaX?: number;
  deltaY?: number;
  key?: string;
  ctrlKey?: boolean;
  isPrimary?: boolean;
  preventDefault?: () => void;
  target?:
    | (EventTarget & {
        getBoundingClientRect?: () => DOMRect;
        closest?: (selectors: string) => Element | null;
      })
    | null;
  toElement?:
    | (EventTarget & {
        closest?: (selectors: string) => Element | null;
      })
    | null;
  srcEvent?: any;
  center?: any;
  pointers?: any[];
  changedTouches?: any;
  changedPointers?: any;
  path?: EventTarget[];
  composedPath?: () => EventTarget[];
  _offset?: { offsetX: number; offsetY: number };
  [key: string]: any;
}

export interface PointerOffset {
  offsetX: number;
  offsetY: number;
}

export type OffsetPointerEvent = PointerEventLike & {
  _offset: PointerOffset;
};

export interface PanelOffset {
  height: number;
  offset: number;
}

export interface CoreInteractor {
  chart: InteractorChartHost;
  topLayer: HTMLDivElement;
  config: ChartConfig;
  fusion: CoreFusionRuntime;
  controller: CoreChartController;
  currentMode: CoreInteractionMode;
  model: CoreChartModel;
  renderer: CoreRenderer;
  ctx: CanvasRenderingContext2D;
  octx: CanvasRenderingContext2D;
  body: HTMLBodyElement;
  currentViewportLeft: number;
  initialMouseEvent: OffsetPointerEvent | null;
  isMouseDown: boolean;
  isRightButton: boolean;
  allowContextMenu: boolean;
  currentHandler: number;
  initialOffsets: PanelOffset[];
  currentHitObject: ChartRuntimeObject | null;
  currentPanel: CoreChartPanel | null;
  currentAnchor: LegacyAnchorSelection | null;
  currentSelectedObject: ChartRuntimeObject | null;
  currentStagingObject: ChartRuntimeObject | null;
  valueAxisClicked: boolean;
  isObjectSelectionAllowed: boolean;
  drawingMagnetEnabled: boolean;
  pinch: InteractorPinchState;
  swipe: InteractorSwipeState;
  doFrame: UnknownFn;
  offDOMEvents: UnknownFn;
  onTouchEvent: UnknownFn;
  registerObjectAsIdicator: UnknownFn;
  unregisterObjectAsIdicator: UnknownFn;
  onPinch: UnknownFn;
  onSwipe: UnknownFn;
  moveIndexToPoint: UnknownFn;
  onContextMenu: UnknownFn;
  requestChartTitleAndShareChart: UnknownFn;
  requestChartTitleAndExportChart: UnknownFn;
  requestTitleAndDescription: UnknownFn;
  requestStrategyTitleAndExportStrategy: UnknownFn;
  exportStrategyToMarket: UnknownFn;
  requestChartTitleAndExportChartToMarket: UnknownFn;
  getSelectedTags: UnknownFn;
  onMouseDown: UnknownFn;
  isRightMouseButton: UnknownFn;
  onMouseLeftUp: UnknownFn;
  onBodyMouseUp: UnknownFn;
  onMouseUp: UnknownFn;
  onBodyMouseOut: UnknownFn;
  onMouseOut: UnknownFn;
  onBodyMouseMove: UnknownFn;
  onMouseMove: UnknownFn;
  onMouseDrag: UnknownFn;
  onRightMouseDrag: UnknownFn;
  onDragObject: UnknownFn;
  onPan: UnknownFn;
  onDragHandler: UnknownFn;
  heightsToBasis: UnknownFn;
  basisToHeights: UnknownFn;
  triggerWheelCallback: UnknownFn;
  getMinPeriodWidth: UnknownFn;
  onKeyUp: UnknownFn;
  onKeyDown: UnknownFn;
  clearOverlay: UnknownFn;
  hideEmptyPanels: UnknownFn;
  getOffsets: UnknownFn;
  isOverHandler: UnknownFn;
  isOver(x1: number, y1: number, x2: number, y2: number, precision: number): boolean;
  getCurrentHitObject(x: number, y: number): ChartRuntimeObject | null;
  getPanel(y: number): CoreChartPanel | null;
  getMainPanel(): CoreChartPanel | null;
  getMainInstrumentPlotter(): ChartRuntimeObject | null;
  hit(x: number, y: number, object: ChartRuntimeObject): unknown;
  deselectAll: UnknownFn;
  select: UnknownFn;
  pushPanel: UnknownFn;
  popPanel: UnknownFn;
  pushIndexes: UnknownFn;
  popIndexes: UnknownFn;
  renderOverlayedObject: UnknownFn;
  init: UnknownFn;
  initAnchor: UnknownFn;
  getStampIndex: UnknownFn;
  doCloseTradeObject: UnknownFn;
  doModifyTradeObject: UnknownFn;
  getOriginalOrder: UnknownFn;
  doAddTradeObject: UnknownFn;
  setMode(symbol: string, object?: ChartRuntimeObject, onFinished?: () => void): void;
  movePanelUpDn: UnknownFn;
  getEventOffset(event: PointerEventLike | null): PointerOffset;
  isAboveValueAxis: UnknownFn;
  setObjectSelectionAllowed(isObjectSelectionAllowed: boolean): void;
  [key: string]: any;
}

export type CoreInteractorConstructor = new (
  chart: any,
  canvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  model: CoreChartModel,
  renderer: CoreRenderer,
  topLayer: HTMLDivElement,
  config: ChartConfig,
  fusion: CoreFusionRuntime,
  controller: CoreChartController
) => CoreInteractor;
