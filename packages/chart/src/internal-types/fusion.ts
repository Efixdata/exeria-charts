import type { Interval, Instrument } from "../types";
import type {
  FusionMatrixConstructor,
  FusionScriptControllerRuntime,
  FusionSignalMatrix,
  RuntimeScriptConfig,
  RuntimeScriptDefinition,
} from "./scripts";
import type { FusionSeriesManager, FusionSeriesRuntime } from "./series";
import type { UnknownFn } from "./shared";

export interface FusionModelRuntime {
  id?: string | number;
  mainSeries?: string | null;
  interval?: Interval | null;
  instrumentsSeries: Array<Record<string, any>>;
  scripts: Array<Record<string, any>>;
  panels?: Array<Record<string, any>>;
  [key: string]: any;
}

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
  loadFusionData(engine: CoreFusionRuntime, onSuccess: UnknownFn, onError: UnknownFn): void;
  loadFusionDataHistoric(engine: CoreFusionRuntime, onSuccess: UnknownFn, onError: UnknownFn): void;
  loadHistory(engine: CoreFusionRuntime, onSuccess: UnknownFn, onError: UnknownFn): void;
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
    withRelated?: boolean
  ): CoreFusionBuilder;
  setInterval(interval: Interval): CoreFusionBuilder;
  addScript(script: Record<string, any>, pos?: number): CoreFusionBuilder;
  addSeries(series: Record<string, any>): CoreFusionBuilder;
  build(): CoreFusionRuntime;
  [key: string]: any;
}

export type CoreFusionBuilderConstructor = new (
  engine?: CoreFusionRuntime | null
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
