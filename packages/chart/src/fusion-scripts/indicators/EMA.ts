import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { resolveScriptModelScalarInput } from "../../scriptInputUtils";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createEMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "emaTitle",
    description: "emaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
    },

    outputs: {
      EMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "emaTitle",
          labels: ["value"],
          fields: ["EMA"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "EMA",
        renderAs: "Line",
        dataField: "EMA",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          const periods = Number(resolveScriptModelScalarInput(this.PERIODS, 14));
          const result = FUSION.lib.getEMA(this.CLOSE, index, periods, this.EMA);
          this.EMA.setValue(index, result);
        };
    }),
  });
}
