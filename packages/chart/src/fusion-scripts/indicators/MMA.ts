import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createMMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "mmaTitle",
    description: "mmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 3 },
    },

    outputs: {
      MMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "mmaTitle",
          labels: ["value"],
          fields: ["MMA"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MMA",
        renderAs: "Line",
        dataField: "MMA",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.MMA.setValue(index, FUSION.lib.getMMA(this.CLOSE, index, this.PERIODS, this.MMA));
        };
    }),
  });
}
