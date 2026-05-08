import type {
  ScriptDefinition,
  ScriptInputDefinition,
  ScriptOutputDefinition,
} from "../types";
import type { CoreFusionRuntime } from "./fusion";
import type { ChartRuntimeObject } from "./objects";
import type { UnknownFn } from "./shared";

export interface ScriptModelConfig {
  id?: string | number;
  outputs: Record<string, string>;
  inputs?: Record<string, unknown>;
  [key: string]: unknown;
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