import type { ChartConfig } from "../types";
import type { CoreChartController, CoreChartModel, CoreChartPanel } from "./chart";
import type { CoreFusionRuntime } from "./fusion";
import type { ChartRuntimeObject } from "./objects";
import type { CoreRenderer } from "./renderer";
import type { UnknownFn } from "./shared";

export interface CoreInteractionMode {
  symbol?: string;
  allowSwipe?: boolean;
  onMouseDown: UnknownFn;
  onMouseUp: UnknownFn;
  onMouseMove: UnknownFn;
  onMouseDrag: UnknownFn;
  onRightMouseDrag: UnknownFn;
  onMouseOut: UnknownFn;
  keyDown: UnknownFn;
  render: UnknownFn;
  renderOverlay: UnknownFn;
  renderUp: UnknownFn;
  renderDn: UnknownFn;
  canBeCloned: UnknownFn;
  onCancel: UnknownFn;
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
  target?: (EventTarget & {
    getBoundingClientRect?: () => DOMRect;
    closest?: (selectors: string) => Element | null;
  }) | null;
  toElement?: (EventTarget & {
    closest?: (selectors: string) => Element | null;
  }) | null;
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

export interface PanelOffset {
  height: number;
  offset: number;
}

export interface CoreInteractor {
  chart: any;
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
  initialMouseEvent: PointerEventLike | null;
  isMouseDown: boolean;
  isRightButton: boolean;
  allowContextMenu: boolean;
  currentHandler: number;
  initialOffsets: PanelOffset[];
  currentHitObject: ChartRuntimeObject | null;
  currentPanel: CoreChartPanel | null;
  currentAnchor: unknown;
  currentSelectedObject: ChartRuntimeObject | null;
  currentStagingObject: ChartRuntimeObject | null;
  valueAxisClicked: boolean;
  isObjectSelectionAllowed: boolean;
  pinch: Record<string, any>;
  swipe: Record<string, any>;
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
  isOver: UnknownFn;
  getCurrentHitObject: UnknownFn;
  getPanel: UnknownFn;
  getMainPanel: UnknownFn;
  getMainInstrumentPlotter: UnknownFn;
  hit: UnknownFn;
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
  setMode: UnknownFn;
  movePanelUpDn: UnknownFn;
  getEventOffset: UnknownFn;
  isAboveValueAxis: UnknownFn;
  setObjectSelectionAllowed: UnknownFn;
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
  controller: CoreChartController,
) => CoreInteractor;