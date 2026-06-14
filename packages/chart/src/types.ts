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

export type {
  ChartAppearanceSettings,
  ChartDrawingSettingsItem,
  ChartGridLineStyle,
  ChartGridMode,
  ChartInstrumentSettingsItem,
  ChartInstrumentSymbolAppearance,
  ChartLineFillMode,
  ChartFunctionSettingsItem,
  ChartIndicatorSettingsItem,
  ChartLegendSettings,
  ChartSettingsTemplate,
  ChartStrategySettingsItem,
  ChartVolumeColorMode,
  ChartVolumeSettings,
} from "./chartSettings";
export type {
  ArbChartScene,
  ArbMetrics,
  ArbSignalBundle,
  ArbSignalCategory,
  ArbSignalQuery,
  ArbSignalRecord,
} from "./arbSignalTypes";

export type { ChartDrawingEditConfig, ChartDrawingEditPatch } from "./drawingEdit";

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

export interface ChartStagingObject {
  type?: string;
  [key: string]: unknown;
}

export interface ChartInteractor {
  currentMode?: ChartMode;
  currentStagingObject?: ChartStagingObject | null;
  completeStagingDrawing?: () => boolean | void;
  setMode(mode: string, options?: Record<string, unknown>, onDrawingDone?: () => void): void;
  setObjectSelectionAllowed?(isAllowed: boolean): void;
  [key: string]: unknown;
}

export interface ToolDrawerApi {
  drawTool(toolConfig: DrawToolConfig): string | number | void;
  drawTrendLine(initialOptions?: TrendLineToolOptions): string | number | void;
  drawTimeRange(initialOptions: TimeRangeToolOptions): string | number | void;
  drawTimeBet(initialOptions: TimeBetToolOptions): string | number | void;
  drawLongShortPosition(initialOptions: LongShortPositionToolOptions): string | number | void;
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

export interface LongShortPositionToolOptions {
  direction?: "LONG" | "SHORT";
  startStamp?: number;
  endStamp?: number;
  stopPrice?: number;
  targetPrice?: number;
  entryPrice?: number;
  accountSize?: number;
  riskMode?: "AMOUNT" | "PERCENT";
  riskAmount?: number;
  riskPercent?: number;
  config?: ToolVisualConfig;
}

import type {
  ChartEnvironmentSnapshot,
  ChartLayoutMode,
  ChartLayoutModeOverride,
} from "./utils/chartEnvironment";

export type { ChartEnvironmentSnapshot, ChartLayoutMode, ChartLayoutModeOverride };

export interface ChartLayoutOptions {
  mode?: import("./utils/chartEnvironment").ChartLayoutModeOverride;
  breakpoints?: {
    compact?: number;
  };
}

export interface ChartEventPayloads {
  AUTOSCALE: { autoScale: boolean };
  CURSOR_CHANGE: { cursor: string };
  INTERVAL_CHANGE: Interval;
  INDICATOR_EDIT_REQUEST: { scriptId: string | number };
  NEWS_FEED_MARKER_CLICK: {
    barIndex: number;
    eventId?: string;
    clientX?: number;
    clientY?: number;
  };
  SCRIPTS_CHANGE: Record<string, never>;
  DRAWING_EDIT_REQUEST: { objectId: string | number };
  OBJECT_SELECTION_ALLOWED_CHANGE: boolean;
  DRAWING_MAGNET_CHANGE: { enabled: boolean };
  DRAWINGS_LOCK_CHANGE: { allLocked: boolean };
  VALUE_AXIS_WIDTH_CHANGE: number;
  LOCALE_CHANGE: { locale: string };
  ENVIRONMENT_CHANGE: ChartEnvironmentSnapshot;
  SELECTED_INSTRUMENT_CHANGE: { seriesId: string };
  INSTRUMENT_DRAW_MODE_CHANGE: { seriesId: string; drawMode: DrawMode };
}

export interface ChartOptions {
  container: HTMLElement;
  instrument?: Instrument;
  config?: ChartConfig;
  model?: Record<string, unknown>;
  theme?: ChartTheme;
  themeVariant?: string;
  locale?: string;
  messages?: Record<string, unknown>;
  layout?: ChartLayoutOptions;
  dataAdapter?: import("./dataAdapter").DataAdapter;
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
  setDataAdapter(adapter: import("./dataAdapter").DataAdapter): void;
  loadData(symbol: string, options: import("./dataAdapter").LoadDataOptions): Promise<void>;
  subscribeToUpdates(
    symbol: string,
    callback?: (update: Tick) => void,
  ): void;
  unsubscribeFromUpdates(): void;
  getCurrentPrice(): Tick | null;
  appendMainSeriesData(data: Candle[]): void;
  appendTick(tick: Tick, recalculate?: boolean): void;
  appendTicks(ticks: Tick[], recalculate?: boolean): void;
  setMainDrawMode(mode: DrawMode): void;
  getMainSeriesId(): string;
  getSelectedInstrumentSeriesId(): string;
  setSelectedInstrumentSeriesId(seriesId: string): void;
  getInstrumentDrawMode(seriesId?: string): DrawMode;
  setInstrumentDrawMode(mode: DrawMode, seriesId?: string): void;
  getValueAxisMode(): ValueAxisMode;
  setValueAxisMode(mode: ValueAxisMode): void;
  getValueAxisWidth(): number;
  getAutoScale(): boolean;
  setAutoScale(autoScale: boolean): void;
  getCurrency(): string | undefined;
  getInterval(): Interval | undefined;
  getScripts(): Record<string, ScriptDefinition>;
  getChartPanels(): Array<{ id: string; label: string; main?: boolean }>;
  getIndicatorEditConfig(scriptId: string | number): ScriptDefinition | null;
  addScript(scriptKey: string, proto?: ScriptDefinition): void | Promise<void>;
  updateIndicator(scriptId: string | number, proto?: ScriptDefinition): void;
  getChartAppearanceSettings(): import("./chartSettings").ChartAppearanceSettings;
  applyChartAppearanceSettings(settings: import("./chartSettings").ChartAppearanceSettings): void;
  getChartLegendSettings(): import("./chartSettings").ChartLegendSettings;
  applyChartLegendSettings(settings: import("./chartSettings").ChartLegendSettings): void;
  getChartInstrumentSettings(): import("./chartSettings").ChartInstrumentSettingsItem[];
  applyChartInstrumentSettings(
    seriesId: string,
    settings: Partial<
      Pick<
        import("./chartSettings").ChartInstrumentSettingsItem,
        "lineColor" | "lineDash" | "drawMode"
      > &
        import("./chartSettings").ChartInstrumentSymbolAppearance
    >,
  ): void;
  applyChartTheme(theme: ChartTheme, themeVariant?: string): void;
  getChartVolumeSettings(): import("./chartSettings").ChartVolumeSettings;
  applyChartVolumeSettings(settings: import("./chartSettings").ChartVolumeSettings): void;
  getChartIndicatorSettings(): import("./chartSettings").ChartIndicatorSettingsItem[];
  setChartIndicatorVisibility(scriptId: string | number, visible: boolean): void;
  setChartIndicatorPriceTagVisibility(scriptId: string | number, visible: boolean): void;
  getChartIndicatorLocked(scriptId: string | number): boolean;
  setChartIndicatorLocked(scriptId: string | number, locked: boolean): void;
  removeChartIndicator(scriptId: string | number): void;
  getChartFunctionSettings(): import("./chartSettings").ChartFunctionSettingsItem[];
  setChartFunctionVisibility(scriptId: string | number, visible: boolean): void;
  setChartFunctionPriceTagVisibility(scriptId: string | number, visible: boolean): void;
  removeChartFunction(scriptId: string | number): void;
  getChartStrategySettings(): import("./chartSettings").ChartStrategySettingsItem[];
  setChartStrategyVisibility(scriptId: string | number, visible: boolean): void;
  removeChartStrategy(scriptId: string | number): void;
  getChartDrawingSettings(): import("./chartSettings").ChartDrawingSettingsItem[];
  setChartDrawingVisibility(objectId: string | number, visible: boolean): void;
  removeChartDrawing(objectId: string | number): void;
  getDrawingEditConfig(objectId: string | number): import("./drawingEdit").ChartDrawingEditConfig | null;
  applyDrawingEditSettings(
    objectId: string | number,
    patch: import("./drawingEdit").ChartDrawingEditPatch,
  ): void;
  exportChartSettingsTemplate(name?: string): import("./chartSettings").ChartSettingsTemplate;
  importChartSettingsTemplate(template: import("./chartSettings").ChartSettingsTemplate): void;
  getSeriesManager(): ChartSeriesManager;
  getInteractor(): ChartInteractor;
  fit(): void;
  render(objectOnlyOnOverlay?: unknown): void;
  renderOverlay(): void;
  onDownload(watermark?: string, watermarkWidth?: number, watermarkHeight?: number): void;
  translate(text: string): string;
  getLocale(): string;
  setLocale(locale: string, messageOverrides?: Record<string, unknown>): void;
  getSupportedLocales(): Array<{ id: string; label: string }>;
  getLocaleMessages(): import("./locale/messages").ChartLocaleMessages;
  getChartEnvironment(): ChartEnvironmentSnapshot;
  setLayoutMode(mode: ChartLayoutModeOverride): void;
  subscribe<TTopic extends keyof ChartEventPayloads>(
    topic: TTopic,
    callback: (data: ChartEventPayloads[TTopic]) => void
  ): ChartSubscription | void;
  subscribe(topic: string, callback: (data: unknown) => void): ChartSubscription | void;
  setCursor(mode: string): void;
  setObjectSelectionAllowed(isAllowed: boolean): void;
  requestIndicatorEdit(scriptId: string | number): void;
  getDrawingMagnetEnabled(): boolean;
  setDrawingMagnetEnabled(enabled: boolean): void;
  getAllDrawingsLocked(): boolean;
  lockAllDrawings(): void;
  unlockAllDrawings(): void;
  destroy(): void;
}
