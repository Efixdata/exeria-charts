import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesOutput,
  createSignalInput,
  createStrategyPlotter,
  defineScript,
} from "../helpers/scriptDefinition";
import { resolveStrategySignal, setSignalOutput } from "../helpers/strategySignals";

export default function createEXCEEDStrategyScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "exceedTitle",
    description: "exceedDescription",
    type: "strategies",
    newPane: false,
    info: [
      { description: "exceedInfo1", image: "Exceed0.svg" },
      { description: "exceedInfo2", image: "Exceed1.svg" },
    ],
    inputs: {
      UPPER: { type: "series", name: "exceedUpper", properties: { def: "BBUpper" }, value: null },
      LOWER: { type: "series", name: "exceedLower", properties: { def: "BBLower" }, value: null },
      HIGH: { type: "series", name: "cSeries", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "dSeries", properties: { def: "l" }, value: null },
      ONDN: createSignalInput("exceedOnDn", "Sell"),
      ONUP: createSignalInput("exceedOnUp", "Buy"),
      SINGLE: { type: "boolean", name: "singleSignal", properties: {}, value: false },
    },

    outputs: {
      EXCEED: createSeriesOutput("exceedTitle", ["signal"], ["ExceedValue"]),
    },

    plotters: [createStrategyPlotter("EXCEED", "ExceedValue")],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["SIGNALSERIES"]);
        this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, "SIGNALSERIES");
      };

      this.calculate = function (this: any, INDEX: any) {
        this.ExceedValue.setValue(INDEX, 0);
        this.ExceedValue.setStrength(INDEX, 1);
        this.SIGNALSERIES.setValue(INDEX, 0);
        var upperBand = this.UPPER.getValue(INDEX);
        var lowerBand = this.LOWER.getValue(INDEX);
        var highValue = this.HIGH.getValue(INDEX);
        var lowValue = this.LOW.getValue(INDEX);

        if (upperBand === null || lowerBand === null || highValue === null || lowValue === null)
          return;

        if (highValue > upperBand) {
          var signal = resolveStrategySignal(FUSION, this.ONDN, FUSION.SELL);
          setSignalOutput(
            this.SIGNALSERIES,
            this.ExceedValue,
            INDEX,
            signal,
            this.SINGLE === true
          );
        } else if (lowValue < lowerBand) {
          var signal = resolveStrategySignal(FUSION, this.ONUP, FUSION.SELL);
          setSignalOutput(
            this.SIGNALSERIES,
            this.ExceedValue,
            INDEX,
            signal,
            this.SINGLE === true
          );
        }
      };
    }),
  });
}
