import type { ValueAxisMode } from "../types";
import type { CoreChartController } from "./chart";
import type { RendererObjectsRegistry } from "./objects";
import type { UnknownFn } from "./shared";

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
  controller: CoreChartController
) => CoreRenderer;
