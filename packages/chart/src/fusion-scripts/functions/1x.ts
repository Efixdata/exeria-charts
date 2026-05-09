import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createScript1xFunctionScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "1xTitle",
    description: "1xDescription",
    type: "functions",
    newPane: true,
    inputs: {
      INDICATOR: { type: "series", name: "indicator", properties: { def: "c" }, value: null },
    },

    outputs: {
      X: {
        type: "series",
        series: {
          seriesId: null,
          title: "1xTitle",
          labels: ["value"],
          fields: ["X"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "X",
        renderAs: "Line",
        dataField: "X",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.X.setValue(index, 1 / this.INDICATOR.getValue(index));
        };
    }),
  });
}
