import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesOutput,
  createSignalInput,
  createStrategyPlotter,
  defineScript,
} from "../helpers/scriptDefinition";
import { resolveStrategySignal } from "../helpers/strategySignals";

export default function createCROSSStrategyScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "crossTitle",
    description: "crossDescription",
    type: "strategies",
    newPane: false,
    info: [{ description: "crossInfo", image: "Cross.svg" }],
    inputs: {
      LINE: { type: "series", name: "aSeries", properties: { def: "MACDLine" }, value: null },
      SIGNAL: { type: "series", name: "bSeries", properties: { def: "MACDSignal" }, value: null },
      ONDN: createSignalInput("crossOnDn", "Buy"),
      ONUP: createSignalInput("crossOnUp", "Sell"),
    },

    outputs: {
      CROSS: createSeriesOutput("crossTitle", ["signal"], ["CrossValue"]),
    },

    plotters: [createStrategyPlotter("CROSS", "CrossValue")],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {};

      this.calculate = function (this: any, INDEX: any) {
        if (INDEX < 2) {
          this.CrossValue.setValue(INDEX, 0);
          this.CrossValue.setStrength(INDEX, 0);
        } else {
          this.CrossValue.setValue(INDEX, 0);
          this.CrossValue.setStrength(INDEX, 1);

          if (this.LINE.getValue(INDEX) === null || this.SIGNAL.getValue(INDEX) === null) {
            return;
          }
          if (this.LINE.getValue(INDEX) < this.SIGNAL.getValue(INDEX)) {
            var c = isCross(this.LINE, this.SIGNAL, INDEX);
            if (c == true) {
              this.CrossValue.setValue(
                INDEX,
                resolveStrategySignal(FUSION, this.ONDN, FUSION.SELL)
              );
            }
          } else if (this.LINE.getValue(INDEX) > this.SIGNAL.getValue(INDEX)) {
            var c = isCross(this.SIGNAL, this.LINE, INDEX);
            if (c == true) {
              this.CrossValue.setValue(
                INDEX,
                resolveStrategySignal(FUSION, this.ONUP, FUSION.BUY)
              );
            }
          }
        }

        function isCross(u: any, l: any, i: any) {
          var x = i - 1;
          if (x > 2) {
            while (x > 2 && u.getValue(x) == l.getValue(x)) {
              x--;
            }
            if (u.getValue(x) > l.getValue(x)) return true;
            else return false;
          } else {
            return false;
          }
        }
      };
    }),
  });
}
