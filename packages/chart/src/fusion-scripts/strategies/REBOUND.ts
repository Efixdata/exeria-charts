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

export default function createREBOUNDStrategyScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "reboundTitle",
    description: "reboundTitle",
    type: "strategies",
    newPane: false,
    info: [
      { description: "reboundInfo1", image: "Rebound0.svg" },
      { description: "reboundInfo2", image: "Rebound1.svg" },
    ],
    inputs: {
      UPPER: { type: "series", name: "reboundUpper", properties: {}, value: null },
      LOWER: { type: "series", name: "reboundLower", properties: {}, value: null },
      VALUE: { type: "series", name: "cSeries", properties: {}, value: null },

      ONDN: createSignalInput("reboundOnUp", "Sell"),
      ONUP: createSignalInput("reboundOnDn", "Buy"),
    },

    outputs: {
      REBOUND: createSeriesOutput("reboundTitle", ["reboundTitle"], ["Rebound"]),
    },

    plotters: [createStrategyPlotter("REBOUND", "Rebound")],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {};

      this.calculate = function (this: any, INDEX: any) {
        this.Rebound.setValue(INDEX, 0);

        if (INDEX > 2) {
          this.Rebound.setStrength(INDEX, 1);

          if (
            this.VALUE.getValue(INDEX) === null ||
            this.UPPER.getValue(INDEX) === null ||
            this.LOWER.getValue(INDEX) === null ||
            this.UPPER.getValue(INDEX - 1) === null ||
            this.LOWER.getValue(INDEX - 1) === null ||
            this.VALUE.getValue(INDEX - 1) === null
          ) {
            return;
          }

          if (
            this.VALUE.getValue(INDEX) < this.UPPER.getValue(INDEX) &&
            this.VALUE.getValue(INDEX - 1) > this.UPPER.getValue(INDEX - 1)
          ) {
            this.Rebound.setValue(INDEX, resolveStrategySignal(FUSION, this.ONDN, FUSION.SELL));
          } else if (
            this.VALUE.getValue(INDEX) > this.LOWER.getValue(INDEX) &&
            this.VALUE.getValue(INDEX - 1) < this.LOWER.getValue(INDEX - 1)
          ) {
            this.Rebound.setValue(INDEX, resolveStrategySignal(FUSION, this.ONUP, FUSION.BUY));
          }
        }
      };
    }),
  });
}
