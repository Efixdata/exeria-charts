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

export default function createGREATERLESSStrategyScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "greaterLessTitle",
    description: "greaterLessDescription",
    type: "strategies",
    newPane: false,
    info: [
      { description: "greaterLessInfo1", image: "Greater-Less0.svg" },
      { description: "greaterLessInfo2", image: "Greater-Less1.svg" },
      { description: "greaterLessInfo3", image: "Greater-Less2.svg" },
    ],
    inputs: {
      LINE1: { type: "series", name: "aSeries", properties: {}, value: null },
      LINE2: { type: "series", name: "bSeries", properties: {}, value: null },

      CHOICE: {
        type: "list",
        name: "greaterLessChoice",
        properties: {},
        list: ["greater than", "less than", "equals"],
        value: "greater than",
      },
      RT: createSignalInput("greaterLessRt", "Sell"),
      SINGLE: { type: "boolean", name: "singleSignal", properties: {}, value: false },
    },

    outputs: {
      GREATERLESS: createSeriesOutput(
        "greaterLessTitle",
        ["greaterLessTitle"],
        ["GreaterLess"]
      ),
    },

    plotters: [createStrategyPlotter("GREATERLESS", "GreaterLess")],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["SIGNALSERIES"]);
        this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, "SIGNALSERIES");
      };

      this.calculate = function (this: any, INDEX: any) {
        if (INDEX < 2) {
          this.SIGNALSERIES.setValue(INDEX, FUSION.DO_NOTHING);
          this.GreaterLess.setValue(INDEX, FUSION.DO_NOTHING);
        } else {
          this.SIGNALSERIES.setValue(INDEX, FUSION.DO_NOTHING);
          this.GreaterLess.setValue(INDEX, FUSION.DO_NOTHING);

          if (this.LINE1.getValue(INDEX) === null || this.LINE2.getValue(INDEX) === null) {
            return;
          }

          if (this.CHOICE == "greater than") {
            if (this.LINE1.getValue(INDEX) > this.LINE2.getValue(INDEX)) {
              var signal = resolveStrategySignal(FUSION, this.RT, FUSION.BUY);
              setSignalOutput(
                this.SIGNALSERIES,
                this.GreaterLess,
                INDEX,
                signal,
                this.SINGLE === true
              );
            }
          } else if (this.CHOICE == "less than") {
            if (this.LINE1.getValue(INDEX) < this.LINE2.getValue(INDEX)) {
              var signal = resolveStrategySignal(FUSION, this.RT, FUSION.SELL);
              setSignalOutput(
                this.SIGNALSERIES,
                this.GreaterLess,
                INDEX,
                signal,
                this.SINGLE === true
              );
            }
          } else {
            if (this.LINE1.getValue(INDEX) == this.LINE2.getValue(INDEX)) {
              var signal = resolveStrategySignal(FUSION, this.RT, FUSION.SELL);
              setSignalOutput(
                this.SIGNALSERIES,
                this.GreaterLess,
                INDEX,
                signal,
                this.SINGLE === true
              );
            }
          }
          this.GreaterLess.setStrength(INDEX, 1);
        }
      };
    }),
  });
}
