import type { Interval, Instrument } from "../types";
import type { ChartPanel } from "./chart";
import type {
  FusionMatrixConstructor,
  FusionScriptControllerRuntime,
  FusionSignalMatrix,
  ScriptModelConfig,
  RuntimeScriptConfig,
  RuntimeScriptDefinition,
} from "./scripts";
import type { FusionSeriesManager, FusionSeriesRuntime } from "./series";
import type { UnknownFn } from "./shared";

export type FusionTooltipStore = Record<string, unknown> | unknown[];

export interface FusionRecord {
  id?: string | number;
  stamp?: number;
  strength?: unknown;
  o?: unknown;
  h?: unknown;
  l?: unknown;
  c?: unknown;
  v?: unknown;
  i?: unknown;
  position?: unknown;
  positionSize?: unknown;
  instrumentId?: string | number;
  userName?: string;
  seriesId?: string | number;
  fields?: string[];
  labels?: string[] | Record<string, string>;
  title?: string;
  data?: FusionSeriesData | null;
  interval?: FusionIntervalRuntime | null;
  instrument?: FusionInstrumentRuntime;
  tooltips?: FusionTooltipStore;
  [key: string]: unknown;
}

export type FusionSeriesData = FusionRecord[] & { seriesId?: string | number };

export interface FusionIntervalRuntime extends Partial<Interval> {
  symbol?: string;
  milis?: number;
  [key: string]: unknown;
}

export interface FusionInstrumentRuntime extends Omit<Partial<Instrument>, "id" | "related"> {
  id?: string | number;
  symbol?: string;
  related?: FusionInstrumentRuntime[];
  relatedKey?: string;
  [key: string]: unknown;
}

export interface FusionInstrumentSeriesRuntime {
  seriesId: string;
  instrument?: FusionInstrumentRuntime;
  interval?: FusionIntervalRuntime | null;
  title?: string;
  data?: FusionSeriesData | null;
  [key: string]: unknown;
}

export interface FusionPanelRuntime extends ChartPanel {
  objects: FusionRecord[];
  [key: string]: unknown;
}

export interface FusionSeriesWrapper {
  getValue(index: number): any;
  setValue(index: number, value: any): void;
  getStrength(index: number): any;
  setStrength(index: number, value: any): void;
  getSeriesLength(): number;
  getStamp(index: number): number | undefined;
  getSeriesId(): string;
}

export interface FusionTooltipSeriesWrapper extends FusionSeriesWrapper {
  clearTooltips(index: number): void;
  setTooltip(index: number, key: string, value: any): void;
  getTooltip(index: number, key: string): any;
}

export interface FusionRawSeriesWrapper {
  getValue(index: number): any;
  setValue(index: number, value: any): void;
  getStamp(index: number): number | undefined;
  getSeriesLength(): number;
  getSeriesId(): string | number | undefined;
}

export interface FusionLoadResponse extends FusionRecord {
  instrument: FusionInstrumentRuntime;
  interval: FusionIntervalRuntime;
  candles: FusionSeriesData;
}

export type FusionLoaderPayload = FusionRecord | Record<string, FusionRecord>;
export type FusionLoaderSuccess = (engine: CoreFusionRuntime, data: FusionLoaderPayload) => void;
export type FusionLoaderError = (error: unknown) => void;
export type FusionLoadCache = Record<string, Record<string | number, FusionRecord>>;

export interface FusionBuilderAddInstrumentRequest {
  instrument: FusionInstrumentRuntime;
  seriesId?: string;
}

export interface FusionBuilderReplaceInstrumentRequest {
  old: FusionInstrumentRuntime;
  new: FusionInstrumentRuntime;
  withRelated?: boolean;
}

export interface FusionModelRuntime {
  id?: string | number;
  mainSeries?: string | null;
  interval?: Interval | null;
  instrumentsSeries: FusionInstrumentSeriesRuntime[];
  scripts: ScriptModelConfig[];
  panels?: FusionPanelRuntime[];
  [key: string]: unknown;
}

export interface CoreFusionRuntime {
  model: FusionModelRuntime;
  seriesManager: FusionSeriesManager;
  scriptsManager: Record<string, FusionScriptControllerRuntime>;
  createSeries(fields: string[]): FusionSeriesData;
  createTooltipSeries(fields: string[]): FusionSeriesData;
  getSeriesWrapper(seriesLink: string): FusionSeriesWrapper;
  getTooltipSeriesWrapper(seriesLink: string): FusionTooltipSeriesWrapper;
  getRawSeriesWrapper(series: FusionSeriesData, field: string): FusionRawSeriesWrapper;
  getId(): string | number | undefined;
  getModel(): FusionModelRuntime;
  getValue(series: string, index: number, field?: string): unknown;
  setValue(series: string, index: number, value: unknown, field?: string): void;
  getSeriesManager(): FusionSeriesManager;
  getMainSeries(): FusionSeriesRuntime & {
    instrument: Instrument;
    interval: Interval;
    title?: string;
    [key: string]: unknown;
  };
  getMainSeriesLastIndex(): number;
  getScriptsManager(): Record<string, FusionScriptControllerRuntime>;
  getSeriesManagerSnapshot(): Record<string, FusionSeriesRuntime>;
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
  setPositions(positionsSeries: FusionSeriesData): void;
  isPositionsSeries(): boolean;
  getPositions(): FusionSeriesRuntime | undefined;
  clearSeriesData(): void;
  isLoaded(): boolean;
  areAllSeriesEmpty(): boolean;
  getEmptyInstrumentSeries(): Record<string, FusionSeriesRuntime>;
  [key: string]: unknown;
}

export interface CoreFusionLoader {
  loaded: FusionLoadCache;
  loadFusionData(
    engine: CoreFusionRuntime,
    onSuccess: FusionLoaderSuccess,
    onError: FusionLoaderError,
  ): void;
  loadFusionDataHistoric(
    engine: CoreFusionRuntime,
    onSuccess: FusionLoaderSuccess,
    onError: FusionLoaderError,
  ): void;
  loadHistory(engine: CoreFusionRuntime, onSuccess: UnknownFn, onError: UnknownFn): void;
  [key: string]: unknown;
}

export type CoreFusionLoaderConstructor = new () => CoreFusionLoader;

export interface CoreFusionBuilder {
  _engine?: CoreFusionRuntime | null;
  _model: FusionModelRuntime;
  _interval?: Interval | null;
  _scripts: RuntimeScriptConfig[];
  _series: FusionSeriesRuntime[];
  _instrumentsToAdd: FusionBuilderAddInstrumentRequest[];
  _instrumentsToReplace: FusionBuilderReplaceInstrumentRequest[];
  setModel(model: FusionModelRuntime): CoreFusionBuilder;
  addInstrument(instrument: FusionInstrumentRuntime, seriesId?: string): CoreFusionBuilder;
  replaceInstrumentByOther(
    oldInstrument: FusionInstrumentRuntime,
    newInstrument: FusionInstrumentRuntime,
    withRelated?: boolean
  ): CoreFusionBuilder;
  setInterval(interval: Interval): CoreFusionBuilder;
  addScript(script: RuntimeScriptConfig, pos?: number): CoreFusionBuilder;
  addSeries(series: FusionSeriesRuntime): CoreFusionBuilder;
  build(): CoreFusionRuntime;
  [key: string]: unknown;
}

export type CoreFusionBuilderConstructor = new (
  engine?: CoreFusionRuntime | null
) => CoreFusionBuilder;

export interface CoreFusionStatic {
  DEBUG: boolean;
  MIN_VALUE: number;
  MAX_VALUE: number;
  BUY: number;
  SELL: number;
  EXIT_LONG: number;
  EXIT_SHORT: number;
  EXIT_ALL: number;
  DO_NOTHING: number;
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
  [key: string]: unknown;
}
