import type {
  FusionScriptControllerRuntime,
  RuntimeScriptDefinition,
  RuntimeScriptInput,
} from "../../internal-types/scripts";
import type { ScriptOutputDefinition } from "../../types";

export type FusionSignalOption =
  | "Buy"
  | "Sell"
  | "Exit long"
  | "Exit short"
  | "Exit all"
  | "Do nothing";

export const FUSION_SIGNAL_OPTIONS: FusionSignalOption[] = [
  "Buy",
  "Sell",
  "Exit long",
  "Exit short",
  "Exit all",
  "Do nothing",
];

type FusionControllerSetup = (this: FusionScriptControllerRuntime) => void;

type FusionPlotter = NonNullable<RuntimeScriptDefinition["plotters"]>[number];

export function defineScript(definition: RuntimeScriptDefinition): RuntimeScriptDefinition {
  return definition;
}

export function createController(
  setup: FusionControllerSetup
): NonNullable<RuntimeScriptDefinition["controller"]> {
  return function controller(context, inputs, outputs) {
    const runtime = {
      id: "",
      context,
      inputs,
      outputs,
      init: function () {},
      calculate: function () {},
    } as FusionScriptControllerRuntime;

    setup.call(runtime);

    return runtime;
  };
}

export function createSignalInput(
  name: string,
  value: FusionSignalOption
): RuntimeScriptInput {
  return {
    type: "list",
    name,
    properties: {},
    list: [...FUSION_SIGNAL_OPTIONS],
    value,
  };
}

export function createSeriesOutput(
  title: string,
  labels: string[],
  fields: string[]
): ScriptOutputDefinition {
  return {
    type: "series",
    series: {
      seriesId: null,
      title,
      labels: [...labels],
      fields: [...fields],
      data: null,
    },
  };
}

export function createStrategyPlotter(dataLink: string, dataField: string): FusionPlotter {
  return {
    type: "StrategyObject",
    dataLink,
    renderAs: "",
    dataField,
    color: "#ff0000",
    width: 1,
    dash: [],
  } as FusionPlotter;
}

export function createSeriesLinePlotter(options: {
  dataLink: string;
  dataField: string;
  color: string;
  width: number;
  renderAs?: string;
  dash?: number[];
  priceTag?: boolean;
  priceLine?: boolean;
}): FusionPlotter {
  return {
    type: "SeriesObject",
    dataLink: options.dataLink,
    renderAs: options.renderAs ?? "Line",
    dataField: options.dataField,
    color: options.color,
    width: options.width,
    dash: options.dash ?? [],
    priceTag: options.priceTag,
    priceLine: options.priceLine,
  } as FusionPlotter;
}