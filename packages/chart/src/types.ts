export type DrawMode = "OHLC" | "Bars" | "Line" | "Histogram" | "Line and Histogram";

export type ValueAxisMode = "lin" | "log" | "perc" | "%";

export interface Interval {
  symbol: string;
  milis: number;
  [key: string]: unknown;
}

export interface Instrument {
  id?: string;
  symbol?: string;
  name?: string;
  currency?: string;
  precision?: number;
  chart?: string;
  availableIntervals?: Interval[];
  interval?: Interval;
  [key: string]: unknown;
}

export interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  stamp: number;
  v?: number;
  [key: string]: unknown;
}

export interface Tick {
  stamp: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
  price?: number;
  [key: string]: unknown;
}

export interface ChartConfig {
  mouseWheelZoomEnabled?: boolean;
  multiInstrumentChart?: boolean;
  storageDisabled?: boolean;
  [key: string]: unknown;
}

export interface ChartTheme {
  [key: string]: unknown;
}

export interface ScriptInputDefinition {
  type?: string;
  name?: string;
  value?: unknown;
  properties?: {
    def?: unknown;
    min?: number;
    max?: number;
    step?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface ScriptOutputSeries {
  title?: string;
  labels?: string[] | Record<string, string>;
  [key: string]: unknown;
}

export interface ScriptOutputDefinition {
  type?: string;
  series?: ScriptOutputSeries;
  labels?: string[] | Record<string, string>;
  [key: string]: unknown;
}

export interface ScriptDefinition {
  key?: string;
  title?: string;
  description?: string;
  type?: string;
  quickAdd?: boolean;
  newPane?: boolean;
  centerZero?: boolean;
  permHide?: boolean;
  plotters?: Array<Record<string, unknown>>;
  inputs: Record<string, ScriptInputDefinition>;
  outputs: Record<string, ScriptOutputDefinition>;
  [key: string]: unknown;
}

export interface ChartSeries {
  seriesId?: string;
  title?: string;
  userName?: string;
  fields: string[];
  labels: string[] | Record<string, string>;
  data?: Candle[];
  instrument?: Instrument;
  interval?: Interval;
  [key: string]: unknown;
}

export type ChartSeriesManager = Record<string, ChartSeries>;

export interface ChartSubscription {
  unsubscribe(): void;
}

export interface ChartMode {
  symbol?: string;
  onCancel?: () => void;
  [key: string]: unknown;
}

export interface ChartInteractor {
  currentMode?: ChartMode;
  setMode(mode: string, options?: Record<string, unknown>, onDrawingDone?: () => void): void;
  setObjectSelectionAllowed?(isAllowed: boolean): void;
  [key: string]: unknown;
}

export interface ToolDrawerApi {
  drawTool(toolConfig: DrawToolConfig): string | number | void;
  drawTrendLine(initialOptions?: TrendLineToolOptions): string | number | void;
  drawTimeRange(initialOptions: TimeRangeToolOptions): string | number | void;
  drawTimeBet(initialOptions: TimeBetToolOptions): string | number | void;
  deleteTool(id: string | number): void;
}

export interface ToolAnchor {
  stamp?: number;
  referenceStamp?: number;
  offset: number;
  value?: number;
  _index: number;
  expandable?: boolean;
  expanded?: boolean;
  defaultDirection?: "left" | "right";
}

export interface ToolVisualConfig {
  editable?: boolean;
  color?: string;
  secondaryColor?: string;
  textColor?: string;
  winningColor?: string;
  losingColor?: string;
  wonColor?: string;
  priceTag?: boolean;
  [key: string]: unknown;
}

export interface DrawToolConfig {
  id?: string | number;
  type?: string;
  name?: string;
  color?: string;
  secondaryColor?: string;
  text?: string;
  textColor?: string;
  editable?: boolean;
  width?: number;
  dash?: number[];
  _hit?: boolean;
  _hitAnchor?: unknown;
  _hitArrow?: unknown;
  anchors?: ToolAnchor[];
  startTime?: number;
  timeRange?: number;
  price?: number;
  predictedDirection?: string;
  reward?: number;
  bet?: number;
  status?: string;
  isWinning?: boolean;
  [key: string]: unknown;
}

export interface TrendLineToolOptions {
  startStamp?: number;
  endStamp?: number;
  startPrice?: number;
  endPrice?: number;
  config?: ToolVisualConfig;
}

export interface TimeRangeToolOptions {
  text?: string;
  startTime?: number;
  timeRange?: number;
  config?: ToolVisualConfig;
}

export interface TimeBetToolOptions {
  price: number;
  predictedDirection?: string;
  reward?: number;
  bet?: number;
  startTime: number;
  timeRange: number;
  status?: string;
  isWinning?: boolean;
  config?: ToolVisualConfig;
}

export interface ChartEventPayloads {
  AUTOSCALE: { autoScale: boolean };
  CURSOR_CHANGE: { cursor: string };
  INTERVAL_CHANGE: Interval;
  OBJECT_SELECTION_ALLOWED_CHANGE: boolean;
  VALUE_AXIS_WIDTH_CHANGE: number;
}

export interface ChartOptions {
  container: HTMLElement;
  instrument?: Instrument;
  config?: ChartConfig;
  model?: Record<string, unknown>;
  theme?: ChartTheme;
  themeVariant?: string;
  [key: string]: unknown;
}

export interface ChartInstance {
  canvas?: HTMLCanvasElement | null;
  ctx?: CanvasRenderingContext2D | null;
  canvasWidth?: number;
  canvasHeight?: number;
  instrument?: Instrument;
  toolDrawer: ToolDrawerApi;
  init(): void;
  setInstrument(instrument: Instrument): void;
  getInstrument(): Instrument | undefined;
  setMainSeriesData(data: Candle[], interval?: Interval, moveToEnd?: boolean): Promise<void>;
  appendMainSeriesData(data: Candle[]): void;
  appendTick(tick: Tick, recalculate?: boolean): void;
  appendTicks(ticks: Tick[], recalculate?: boolean): void;
  setMainDrawMode(mode: DrawMode): void;
  getValueAxisMode(): ValueAxisMode;
  setValueAxisMode(mode: ValueAxisMode): void;
  getValueAxisWidth(): number;
  getAutoScale(): boolean;
  setAutoScale(autoScale: boolean): void;
  getCurrency(): string | undefined;
  getInterval(): Interval | undefined;
  getScripts(): Record<string, ScriptDefinition>;
  addScript(scriptKey: string, proto?: ScriptDefinition): void;
  getSeriesManager(): ChartSeriesManager;
  getInteractor(): ChartInteractor;
  onDownload(watermark?: string, watermarkWidth?: number, watermarkHeight?: number): void;
  translate(text: string): string;
  subscribe<TTopic extends keyof ChartEventPayloads>(
    topic: TTopic,
    callback: (data: ChartEventPayloads[TTopic]) => void
  ): ChartSubscription | void;
  subscribe(topic: string, callback: (data: unknown) => void): ChartSubscription | void;
  setCursor(mode: string): void;
  setObjectSelectionAllowed(isAllowed: boolean): void;
  destroy(): void;
}
