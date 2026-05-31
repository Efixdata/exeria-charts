import type { ValueAxisMode } from "../types";
import type { CoreChartController, CoreChartModel, CoreChartPanel } from "./chart";
import type { CoreFusionRuntime } from "./fusion";
import type { ChartRuntimeObject, RendererObjectExtremes, RendererObjectsRegistry } from "./objects";
import type { OhlcvCandle, SeriesManager } from "./series";

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

export interface PriceCoordinateOptions {
  panelHeight: number;
  minValue: number;
  maxValue: number;
  valueAxisMode?: ValueAxisMode | string;
  fV?: unknown;
  [key: string]: unknown;
}

export interface PriceRenderingOptions {
  valueAxisWidth: number;
  magnitude: number;
  zerosToReduce: number;
  axisLabelPrefix: string;
  axisUsePrefixHeader: boolean;
  [key: string]: unknown;
}

export interface ValueAxisTick {
  maxTicks: number;
  range: number;
  tickSpacing: number;
  niceMin: number;
  niceMax: number;
  [key: string]: unknown;
}

export interface ValueConverterLike {
  mode?: string;
  realToAxis(value: number, referenceValue?: unknown): number;
  axisToReal?(value: number, referenceValue?: unknown): number;
  [key: string]: any;
}

export interface RendererHiddenDateParts {
  day?: boolean;
  month?: boolean;
  year?: boolean;
  hour?: boolean;
}

export type RendererOmitObject = ChartRuntimeObject | Pick<ChartRuntimeObject, "id"> | boolean | null | undefined;
export type RendererTagStyle = "RECTANGLE" | "ARROW" | string;
export type RendererValueType = "real" | string;

export interface RendererSeriesLike {
  data?: unknown[] | null;
}

export type RendererValidateSeriesMethod = (series: RendererSeriesLike | null | undefined) => void;
export type RendererRenderMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  fusion: CoreFusionRuntime,
  translate?: boolean,
  omitObject?: RendererOmitObject,
) => void;
export type RendererRenderPanelMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  fusion: CoreFusionRuntime,
  omitObject?: RendererOmitObject,
) => void;
export type RendererRenderPlotPaneMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  seriesManager: SeriesManager,
  omitObject?: RendererOmitObject,
) => void;
export type RendererErrorHandler = (error: unknown) => void;
export type RendererPostRenderPlotPaneMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  seriesManager: SeriesManager,
  omitObject?: RendererOmitObject,
) => void;
export type RendererPanelVisibilityMethod = (panel: CoreChartPanel) => boolean;
export type RendererOverlayMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  fusion: CoreFusionRuntime,
) => void;
export type RendererPostOverlayMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  seriesManager: SeriesManager,
) => void;
export type RendererSelectionHandlesMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  fusion: CoreFusionRuntime,
  selectedObject: ChartRuntimeObject,
) => void;
export type RendererValueAxisMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  tick: ValueAxisTick,
) => void;
export type RendererHGridMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  tick: ValueAxisTick,
) => void;
export type RendererVGridMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  ticks: number[],
) => void;
export type RendererTimeAxisMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  ticks: number[],
  fusion: CoreFusionRuntime,
) => void;
export type RendererPanelMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
) => void;
export type RendererLegendMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  fusion: CoreFusionRuntime,
) => boolean | void;
export type RendererLegendLineMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  object: ChartRuntimeObject,
  count: number,
  fusion: CoreFusionRuntime,
  legendsRendered: string[],
) => boolean | void;
export type RendererPriceTagMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  y: number,
  color: string,
  textColor: string,
  value: number | null | undefined,
  valueType?: RendererValueType,
  style?: RendererTagStyle,
) => void;
export type RendererDoublePriceTagMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  panel: CoreChartPanel,
  y1: number,
  y2: number,
  color: string,
  textColor: string,
  innerColor: string,
  innerTextColor: string,
  value1: number,
  value2: number,
  valueType?: RendererValueType,
) => void;
export type RendererTimeTagMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  x: number,
  color: string,
  textColor: string,
  fusion: CoreFusionRuntime,
) => void;
export type RendererDoubleTimeTagMethod = (
  context: CanvasRenderingContext2D,
  model: CoreChartModel,
  x1: number,
  x2: number,
  color: string,
  textColor: string,
  fusion: CoreFusionRuntime,
) => void;
export type RendererIndexPointMethod = (index: number, model: CoreChartModel) => number;
export type RendererPointIndexMethod = (x: number, model: CoreChartModel) => number;
export type RendererStampPointMethod = (
  stamp: number,
  model: CoreChartModel,
  seriesManager: SeriesManager,
) => number;
export type RendererStampIndexMethod = (
  stamp: number,
  model: CoreChartModel,
  seriesManager: SeriesManager,
) => number;
export type RendererIndexStampMethod = (
  index: number,
  model: CoreChartModel,
  seriesManager: SeriesManager,
) => number;
export type RendererPriceCoordinateMethod = (
  price: number,
  options: PriceCoordinateOptions,
) => number;
export type RendererTimeTicksMethod = (
  model: CoreChartModel,
  seriesManager?: SeriesManager,
) => number[];
export type RendererFallbackTimeTicksMethod = (
  model: CoreChartModel,
  lastIndex: number,
  plotWidth: number,
) => number[];
export type RendererNiceTickMethod = (
  model: CoreChartModel,
  panel: CoreChartPanel,
) => ValueAxisTick;
export type RendererNiceNumberMethod = (range: number, round: boolean) => number;
export type RendererPrettyDateMethod = (
  stamp: number,
  hidden?: RendererHiddenDateParts,
) => string;
export type RendererZeroLeadMethod = (value: number) => string;

export type LegendCloseHit = {
  scriptId: string | number;
  x: number;
  y: number;
  w: number;
  h: number;
};
export type RendererGetLegendHitMethod = (x: number, y: number) => LegendCloseHit | null;
export type RendererPrecisionMethod = (
  model: CoreChartModel,
  panel: CoreChartPanel,
) => number;
export type RendererPriceRenderingOptionsMethod = (
  data: OhlcvCandle[],
  model: CoreChartModel,
  precision: number,
) => void;
export type RendererGetPriceRenderingOptionsMethod = () => PriceRenderingOptions;

export interface CoreRenderer {
  context: CanvasRenderingContext2D | null;
  controller: CoreChartController;
  settings: RendererSettings;
  priceRenderingOptions: PriceRenderingOptions;
  volumePrecision: number;
  objects: RendererObjectsRegistry;
  timeTicks: number[];
  validateSeriesBeforeRender: RendererValidateSeriesMethod;
  render: RendererRenderMethod;
  renderPanel: RendererRenderPanelMethod;
  renderPlotPane: RendererRenderPlotPaneMethod;
  onErrorWhileRendering: RendererErrorHandler;
  postRenderPlotPane: RendererPostRenderPlotPaneMethod;
  shouldBePanelVisible: RendererPanelVisibilityMethod;
  renderOverlay: RendererOverlayMethod;
  renderRangeAxisGuides: RendererOverlayMethod;
  postRenderOverlay: RendererPostOverlayMethod;
  renderSelectionHandles: RendererSelectionHandlesMethod;
  renderValueAxis: RendererValueAxisMethod;
  renderHGrid: RendererHGridMethod;
  renderVGrid: RendererVGridMethod;
  renderTimeAxis: RendererTimeAxisMethod;
  renderHandler: RendererPanelMethod;
  renderLegend: RendererLegendMethod;
  renderLegendLine: RendererLegendLineMethod;
  getLegendHit: RendererGetLegendHitMethod;
  drawPriceTag: RendererPriceTagMethod;
  drawDoublePriceTag: RendererDoublePriceTagMethod;
  drawTimeTag: RendererTimeTagMethod;
  drawDoubleTimeTag: RendererDoubleTimeTagMethod;
  getIndexPoint: RendererIndexPointMethod;
  getPointIndex: RendererPointIndexMethod;
  getStampPoint: RendererStampPointMethod;
  getStampIndex: RendererStampIndexMethod;
  getIndexStamp: RendererIndexStampMethod;
  getYCoordinateForPrice: RendererPriceCoordinateMethod;
  getPriceForYCoordinate: RendererPriceCoordinateMethod;
  calculateTimeTicks: RendererTimeTicksMethod;
  buildFallbackTimeTicks: RendererFallbackTimeTicksMethod;
  calculateNiceTick: RendererNiceTickMethod;
  niceNum: RendererNiceNumberMethod;
  getPrettyDate: RendererPrettyDateMethod;
  zeroLead: RendererZeroLeadMethod;
  getPrecision: RendererPrecisionMethod;
  calculatePriceRenderingOptions: RendererPriceRenderingOptionsMethod;
  getPriceRenderingOptions: RendererGetPriceRenderingOptionsMethod;
  months: string[];
  [key: string]: unknown;
}

export type CoreRendererConstructor = new (
  settings: RendererSettings,
  context: CanvasRenderingContext2D | null,
  controller: CoreChartController
) => CoreRenderer;
