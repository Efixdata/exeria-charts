import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesLinePlotter,
  createSeriesOutput,
  defineScript,
} from "../helpers/scriptDefinition";
import { updateAtrSeries } from "../helpers/indicatorMath";

export default function createATRIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "atrTitle",
    description: "atrDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 12 },
    },

    outputs: {
      ATR: createSeriesOutput("atrTitle", ["atrTitle"], ["ATR"]),
    },

    plotters: [
      createSeriesLinePlotter({
        dataLink: "ATR",
        dataField: "ATR",
        color: "#00bcd4",
        width: 1.5,
        priceTag: false,
        priceLine: false,
      }),
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["TRUERANGE"]);
        this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
      };

      this.calculate = function (this: any, index: any) {
        updateAtrSeries({
          FUSION,
          high: this.HIGH,
          low: this.LOW,
          close: this.CLOSE,
          index,
          period: this.PERIODS,
          trueRangeSeries: this.TRUERANGE,
          atrSeries: this.ATR,
        });
      };
    }),
  });
}
