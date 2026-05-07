import type {
  Candle,
  ChartConfig,
  ChartEventPayloads,
  Interval,
  Instrument,
  ScriptDefinition,
  ScriptInputDefinition,
  ScriptOutputDefinition,
  ValueAxisMode,
} from "./types";

export interface OhlcvCandle extends Candle {
  i?: number | null;
  [key: string]: unknown;
}

export interface TickLike {
  stamp: number;
  volume?: number;
  dailyVolume?: number;
  price?: number;
  [key: string]: unknown;
}

export interface SeriesBase {
  seriesId: string;
  title?: string;
  userName?: string;
  fields: string[];
  labels: string[] | Record<string, string>;
  interval: Interval;
  instrument?: Instrument;
  [key: string]: unknown;
}

export interface SeriesWithData extends SeriesBase {
  data: OhlcvCandle[];
}

export interface SeriesModel extends SeriesBase {
  data: OhlcvCandle[] | null;
}

export type SeriesManager = Record<string, SeriesWithData>;

export interface ScriptModelConfig {
  id?: string | number;
  outputs: Record<string, string>;
  inputs?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ChartPanelObject {
  id?: string | number;
  dataLink?: string;
  dataField?: string | null;
  type?: string;
  reference?: string | null;
  drag?: boolean;
  [key: string]: unknown;
}

export interface ChartPanel {
  id?: string | number;
  basis?: number;
  objects: ChartPanelObject[];
  [key: string]: unknown;
}

export interface InstrumentSeriesRef {
  seriesId: string;
  title?: string;
  instrument?: Instrument;
  [key: string]: unknown;
}

export interface ChartModelFragment {
  panels: ChartPanel[];
  instrumentsSeries: InstrumentSeriesRef[];
  scripts?: ScriptModelConfig[];
  mainSeries?: string;
  _leftIndex: number;
  _rightIndex: number;
  [key: string]: unknown;
}

export interface ChartLike {
  model: ChartModelFragment;
  fusion: {
    getSeriesManager(): SeriesManager;
  };
}

export interface RendererActionHandleSettings {
  x: number;
  w: number;
}

export interface RendererBarSettings {
  color: string;
  text_color: string;
  x: number;
  w: number;
  h: number;
  r: number;
  spacing: number;
  closeBtn: RendererActionHandleSettings;
  dragTpSlHandler: RendererActionHandleSettings;
}

export interface RendererLineSettings {
  color: string;
  w: number;
  dash: number[];
}

export interface RendererConnectionsSettings extends RendererLineSettings {
  alpha: number;
}

export interface RendererRunnerMarkerSettings {
  x: number;
  w: number;
  activeBg: string;
  color: string;
  inactiveBg: string;
}

export interface RendererRelatedBarSettings {
  alpha: number;
  color: string;
}

export interface RendererEntitySettings {
  bar: RendererBarSettings;
  line: RendererLineSettings;
  connections: RendererConnectionsSettings;
  runnerMarker: RendererRunnerMarkerSettings;
  relatedBar: RendererRelatedBarSettings;
}

export interface RendererSettings {
  orders: RendererEntitySettings;
  positions: RendererEntitySettings;
}

export type UnknownFn = (...args: any[]) => any;

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

export interface ChartZeroLine {
  color: string;
  width: number;
  dash: number[];
  [key: string]: unknown;
}

export interface CoreChartPanel extends ChartPanel {
  id: string | number;
  basis: number;
  valueAxisMode: ValueAxisMode | string;
  hGrid: boolean;
  vGrid: boolean;
  vMax: number;
  vMin: number;
  _visible: boolean;
  _width: number;
  _height: number;
  _offset: number;
  _index?: number;
  main?: boolean;
  centerZero?: boolean;
  precision?: number;
  zeroLine?: ChartZeroLine;
  objects: ChartRuntimeObject[];
  [key: string]: any;
}

export interface InstrumentSeriesRuntime extends InstrumentSeriesRef {
  seriesId: string;
  instrument?: Instrument;
  [key: string]: any;
}

export interface ChartObjectCollection {
  visible: boolean;
  selected?: boolean;
  list: ChartRuntimeObject[];
  [key: string]: any;
}

export interface CoreChartModel extends ChartModelFragment {
  panels: CoreChartPanel[];
  instrumentsSeries: InstrumentSeriesRuntime[];
  scripts: ScriptModelConfig[];
  mainSeries: string;
  interval?: Interval;
  autoScale: boolean;
  endMargin: number;
  extremesMargin: number;
  periodWidth: number;
  timeAxisHeight: number;
  valueAxisWidth: number;
  valueAxisPadding: number;
  minTimeTickWidth: number;
  minValueTickHeight: number;
  minPanelHeight: number;
  viewportLeft: number;
  mode?: string;
  orders: ChartObjectCollection;
  positions: ChartObjectCollection;
  _width: number;
  _height: number;
  _timeAxisWidth: number;
  _midOffset: number;
  _leftIndex: number;
  _rightIndex: number;
  [key: string]: any;
}

export interface PriceCoordinateOptions {
  panelHeight: number;
  minValue: number;
  maxValue: number;
  valueAxisMode?: ValueAxisMode | string;
  fV?: unknown;
  [key: string]: any;
}

export interface PriceRenderingOptions {
  valueAxisWidth: number;
  magnitude: number;
  zerosToReduce: number;
  [key: string]: any;
}

export interface ValueAxisTick {
  maxTicks: number;
  range: number;
  tickSpacing: number;
  niceMin: number;
  niceMax: number;
  [key: string]: any;
}

export interface ValueConverterLike {
  mode?: string;
  realToAxis(value: number, referenceValue?: unknown): number;
  axisToReal?(value: number, referenceValue?: unknown): number;
  [key: string]: any;
}

export interface RuntimeScriptInput extends ScriptInputDefinition {
  properties?: ScriptInputDefinition["properties"] & {
    def?: unknown;
  };
}

export interface RuntimeScriptDefinition extends ScriptDefinition {
  plotters?: ChartRuntimeObject[];
  inputs: Record<string, RuntimeScriptInput>;
  outputs: Record<string, ScriptOutputDefinition>;
  controller?: (
    context: CoreFusionRuntime,
    inputs: Record<string, any>,
    outputs: Record<string, any>,
  ) => FusionScriptControllerRuntime;
  [key: string]: any;
}

export interface RuntimeScriptConfig extends ScriptModelConfig {
  key: string;
  pane?: string | number;
  userName?: string;
  visible?: boolean;
  permHide?: boolean;
  reference?: string | null;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  [key: string]: any;
}

export interface FusionSeriesRuntime {
  seriesId: string;
  fields: string[];
  labels: string[] | Record<string, string>;
  interval: Interval;
  data: any;
  title?: string;
  userName?: string;
  instrument?: Instrument;
  [key: string]: any;
}

export type FusionSeriesManager = Record<string, FusionSeriesRuntime>;

export interface FusionModelRuntime {
  id?: string | number;
  mainSeries?: string | null;
  interval?: Interval | null;
  instrumentsSeries: Array<Record<string, any>>;
  scripts: Array<Record<string, any>>;
  panels?: Array<Record<string, any>>;
  [key: string]: any;
}

export interface FusionScriptControllerRuntime {
  id?: string | number;
  context: CoreFusionRuntime;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  init: UnknownFn;
  calculate: UnknownFn;
  onModify?: UnknownFn;
  [key: string]: any;
}

export type FusionScriptControllerConstructor = any;

export interface FusionSignalMatrix {
  [key: string]: Record<string, string>;
}

export type FusionMatrixConstructor = new () => FusionSignalMatrix;

export interface CoreFusionRuntime {
  model: FusionModelRuntime;
  seriesManager: FusionSeriesManager;
  scriptsManager: Record<string, FusionScriptControllerRuntime>;
  createSeries(fields: string[]): Array<Record<string, any>>;
  createTooltipSeries(fields: string[]): Array<Record<string, any>>;
  getSeriesWrapper(seriesLink: string): Record<string, UnknownFn>;
  getTooltipSeriesWrapper(seriesLink: string): Record<string, UnknownFn>;
  getRawSeriesWrapper(series: Array<Record<string, any>>, field: string): Record<string, UnknownFn>;
  getId(): string | number | undefined;
  getModel(): FusionModelRuntime;
  getValue(series: string, index: number, field?: string): any;
  setValue(series: string, index: number, value: any, field?: string): void;
  getSeriesManager(): FusionSeriesManager;
  getMainSeries(): FusionSeriesRuntime & {
    instrument: Instrument;
    interval: Interval;
    title?: string;
    [key: string]: any;
  };
  getMainSeriesLastIndex(): number;
  getScriptsManager(): Record<string, FusionScriptControllerRuntime>;
  getSeriesManagerSnapshot(): Record<string, any>;
  getSeriesById(seriesId: string): FusionSeriesRuntime | undefined;
  fullSynchronization(): void;
  shortSynchronization(): void;
  configureScripts(): void;
  configureScript(config: RuntimeScriptConfig): void;
  initAll(): Promise<void> | void;
  calculateAll(): void;
  calculate(script: FusionScriptControllerRuntime, mainSeries: FusionSeriesRuntime): void;
  addScript(config: RuntimeScriptConfig): Promise<void> | void;
  modifyScript(config: RuntimeScriptConfig): Promise<void> | void;
  setPositions(positionsSeries: Array<Record<string, any>>): void;
  isPositionsSeries(): boolean;
  getPositions(): FusionSeriesRuntime | undefined;
  clearSeriesData(): void;
  isLoaded(): boolean;
  areAllSeriesEmpty(): boolean;
  getEmptyInstrumentSeries(): Record<string, FusionSeriesRuntime>;
  [key: string]: any;
}

export interface CoreFusionLoader {
  loaded: Record<string, any>;
  loadFusionData(
    engine: CoreFusionRuntime,
    onSuccess: UnknownFn,
    onError: UnknownFn,
  ): void;
  loadFusionDataHistoric(
    engine: CoreFusionRuntime,
    onSuccess: UnknownFn,
    onError: UnknownFn,
  ): void;
  loadHistory(
    engine: CoreFusionRuntime,
    onSuccess: UnknownFn,
    onError: UnknownFn,
  ): void;
  [key: string]: any;
}

export type CoreFusionLoaderConstructor = new () => CoreFusionLoader;

export interface CoreFusionBuilder {
  _engine?: CoreFusionRuntime | null;
  _model: FusionModelRuntime;
  _interval?: Interval | null;
  _scripts: Array<Record<string, any>>;
  _series: Array<Record<string, any>>;
  _instrumentsToAdd: Array<Record<string, any>>;
  _instrumentsToReplace: Array<Record<string, any>>;
  setModel(model: FusionModelRuntime): CoreFusionBuilder;
  addInstrument(instrument: any, seriesId?: string): CoreFusionBuilder;
  replaceInstrumentByOther(
    oldInstrument: any,
    newInstrument: any,
    withRelated?: boolean,
  ): CoreFusionBuilder;
  setInterval(interval: Interval): CoreFusionBuilder;
  addScript(script: Record<string, any>, pos?: number): CoreFusionBuilder;
  addSeries(series: Record<string, any>): CoreFusionBuilder;
  build(): CoreFusionRuntime;
  [key: string]: any;
}

export type CoreFusionBuilderConstructor = new (
  engine?: CoreFusionRuntime | null,
) => CoreFusionBuilder;

export interface CoreFusionStatic {
  Matrix: FusionMatrixConstructor;
  engine: new () => CoreFusionRuntime;
  loader: CoreFusionLoaderConstructor;
  builder: CoreFusionBuilderConstructor;
  scripts: Record<string, RuntimeScriptDefinition>;
  lib: Record<string, UnknownFn>;
  signals: Record<string, number>;
  signalValueToName(value: number): string | undefined;
  signalNameToValue(name: string): number | undefined;
  createDoubleCheckMatrix(): FusionSignalMatrix;
  createSelectiveSignalsMatrix(): FusionSignalMatrix;
  getAvailableScript(key: string): RuntimeScriptDefinition | null | undefined;
  getScript(key: string): RuntimeScriptDefinition;
  getAvailableScripts(): Record<string, RuntimeScriptDefinition>;
  getAllScripts(): Record<string, RuntimeScriptDefinition>;
  getFreeScripts(): Record<string, RuntimeScriptDefinition>;
  availableScripts?: Record<string, RuntimeScriptDefinition>;
  freeScripts?: Record<string, RuntimeScriptDefinition>;
  uniqueId(): string | number;
  [key: string]: any;
}

export interface CoreRendererObject {
  render: UnknownFn;
  postRender: UnknownFn;
  renderOverlay: UnknownFn;
  postRenderOverlay: UnknownFn;
  updateExtremes: UnknownFn;
  hit: UnknownFn;
  clearHits: UnknownFn;
  push: UnknownFn;
  pop: UnknownFn;
  mouseDown: UnknownFn;
  mouseUp: UnknownFn;
  mouseMove: UnknownFn;
  mouseOut: UnknownFn;
  mouseDrag: UnknownFn;
  stageDown: UnknownFn;
  stageUp: UnknownFn;
  stageMove: UnknownFn;
  stageDrag: UnknownFn;
  stageOut: UnknownFn;
  getToolTip: UnknownFn;
  isDraggable?: boolean;
  [key: string]: any;
}

export interface RendererObjectsRegistry {
  [key: string]: any;
}

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

export interface CoreChartController {
  container: HTMLElement;
  canvas: HTMLCanvasElement;
  overlay: HTMLCanvasElement;
  topLayer: HTMLDivElement;
  ctx: CanvasRenderingContext2D;
  octx: CanvasRenderingContext2D;
  renderer: CoreRenderer;
  model: CoreChartModel;
  fusion: CoreFusionRuntime;
  interactor: CoreInteractor;
  config: ChartConfig;
  instrument?: Instrument;
  objectOnlyOnOverlay: boolean;
  canvasWidth: number;
  canvasHeight: number;
  currentAnimationFrame?: number;
  valueConverter?: ValueConverterLike;
  initialized: boolean;
  doFrame: UnknownFn;
  fit: UnknownFn;
  render: UnknownFn;
  renderOverlay: UnknownFn;
  rerender: UnknownFn;
  fitAndRepaint: UnknownFn;
  calculateAll: UnknownFn;
  chartStructureChanged: UnknownFn;
  updateToolsOptions: UnknownFn;
  emitEvent: UnknownFn;
  onDelete: UnknownFn;
  onCrosshair: UnknownFn;
  moveToEnd: UnknownFn;
  setAutoScale: UnknownFn;
  repaint: UnknownFn;
  saveInstance: UnknownFn;
  destroy: UnknownFn;
  onDrawingDone: UnknownFn;
  addPanelToModel: UnknownFn;
  isChartEmpty: UnknownFn;
  getSeriesManager: UnknownFn;
  getScriptsManager: UnknownFn;
  removePanelFromModel: UnknownFn;
  [key: string]: any;
}

export interface CoreRenderer {
  context: CanvasRenderingContext2D | null;
  controller: CoreChartController;
  settings: RendererSettings;
  priceRenderingOptions: PriceRenderingOptions;
  volumePrecision: number;
  objects: RendererObjectsRegistry;
  timeTicks: number[];
  validateSeriesBeforeRender: UnknownFn;
  render: UnknownFn;
  renderPanel: UnknownFn;
  renderPlotPane: UnknownFn;
  onErrorWhileRendering: UnknownFn;
  postRenderPlotPane: UnknownFn;
  shouldBePanelVisible: UnknownFn;
  renderOverlay: UnknownFn;
  postRenderOverlay: UnknownFn;
  renderValueAxis: UnknownFn;
  renderHGrid: UnknownFn;
  renderVGrid: UnknownFn;
  renderTimeAxis: UnknownFn;
  renderHandler: UnknownFn;
  renderLegend: UnknownFn;
  renderLegendLine: UnknownFn;
  drawPriceTag: UnknownFn;
  drawDoublePriceTag: UnknownFn;
  drawTimeTag: UnknownFn;
  drawDoubleTimeTag: UnknownFn;
  getIndexPoint: UnknownFn;
  getPointIndex: UnknownFn;
  getStampPoint: UnknownFn;
  getStampIndex: UnknownFn;
  getIndexStamp: UnknownFn;
  getYCoordinateForPrice: UnknownFn;
  getPriceForYCoordinate: UnknownFn;
  calculateTimeTicks: UnknownFn;
  calculateNiceTick: UnknownFn;
  niceNum: UnknownFn;
  getPrettyDate: UnknownFn;
  zeroLead: UnknownFn;
  getPrecision: UnknownFn;
  calculatePriceRenderingOptions: UnknownFn;
  getPriceRenderingOptions: UnknownFn;
  months: string[];
  [key: string]: any;
}

export type CoreRendererConstructor = new (
  settings: RendererSettings,
  context: CanvasRenderingContext2D | null,
  controller: CoreChartController,
) => CoreRenderer;

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

export interface ChartRecalculateOptions {
  rerender?: boolean;
  shortSynchronization?: boolean;
}

export interface ChartMarginInfo {
  i: number;
  x: number;
}

export interface ChartEventEnvelope<TTopic extends keyof ChartEventPayloads = keyof ChartEventPayloads> {
  topic: TTopic;
  data: ChartEventPayloads[TTopic];
}