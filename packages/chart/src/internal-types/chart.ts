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
import type { FusionScriptControllerRuntime, ScriptModelConfig } from "./scripts";
import type { InstrumentSeriesRef, InstrumentSeriesRuntime, SeriesManager } from "./series";

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
  [key: string]: unknown;
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
  [key: string]: unknown;
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
  doFrame(callback: () => void): void;
  fit(): void;
  render(objectOnlyOnOverlay?: ChartRuntimeObject | boolean | null): void;
  renderOverlay(): void;
  rerender(): void;
  fitAndRepaint(): void;
  calculateAll(): void;
  chartStructureChanged(mode?: unknown): void;
  updateToolsOptions(config: Record<string, unknown>): void;
  emitEvent<TTopic extends keyof ChartEventPayloads>(event: ChartEventEnvelope<TTopic>): void;
  onDelete(objectId?: string | number): void;
  onCrosshair(): boolean;
  moveToEnd(options?: { rerender?: boolean }): void;
  setAutoScale(autoScale: boolean): void;
  repaint(): void;
  saveInstance(): void;
  destroy(): void;
  onDrawingDone(): void;
  addPanelToModel(): CoreChartPanel;
  isChartEmpty(chart?: unknown): boolean;
  getSeriesManager(): SeriesManager;
  getScriptsManager(): Record<string, FusionScriptControllerRuntime>;
  removePanelFromModel(panel: CoreChartPanel): void;
  [key: string]: unknown;
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
