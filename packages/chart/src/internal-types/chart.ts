import type {
  ChartConfig,
  ChartEventPayloads,
  Interval,
  Instrument,
  ValueAxisMode,
} from "../types";
import type { CoreFusionRuntime } from "./fusion";
import type { CoreInteractor } from "./interactor";
import type { ChartObjectCollection, ChartPanelObject, ChartRuntimeObject } from "./objects";
import type { CoreRenderer, ValueConverterLike } from "./renderer";
import type { ScriptModelConfig } from "./scripts";
import type { InstrumentSeriesRef, InstrumentSeriesRuntime, SeriesManager } from "./series";
import type { UnknownFn } from "./shared";

export interface ChartPanel {
  id?: string | number;
  basis?: number;
  objects: ChartPanelObject[];
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

export interface ChartRecalculateOptions {
  rerender?: boolean;
  shortSynchronization?: boolean;
}

export interface ChartMarginInfo {
  i: number;
  x: number;
}

export interface ChartEventEnvelope<
  TTopic extends keyof ChartEventPayloads = keyof ChartEventPayloads,
> {
  topic: TTopic;
  data: ChartEventPayloads[TTopic];
}
