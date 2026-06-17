import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { resolveScriptModelScalarInput } from "../../scriptInputUtils";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createWMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "wmaTitle",
    description: "wmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
    },

    outputs: {
      WMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "wmaTitle",
          labels: ["value"],
          fields: ["WMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "WMA",
        renderAs: "Line",
        dataField: "WMAValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          const periods = Number(resolveScriptModelScalarInput(this.PERIODS, 9));
          this.WMAValue.setValue(index, FUSION.lib.getWMA(this.CLOSE, index, periods));
        };
    }),
  });
}
