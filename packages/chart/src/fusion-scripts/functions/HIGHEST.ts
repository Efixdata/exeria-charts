import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createHIGHESTFunctionScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "highestTitle",
    description: "highestDescription",
    type: "functions",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "price", properties: { def: "h" }, value: null },
      PERIODS: {
        type: "integer",
        name: "period",
        properties: { def: 25, max: 100, min: 0 },
        value: 25,
      },
    },

    outputs: {
      HIGHEST: {
        type: "series",
        series: {
          seriesId: null,
          title: "highestTitle",
          labels: ["value"],
          fields: ["HIGHEST"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "HIGHEST",
        renderAs: "Line",
        dataField: "HIGHEST",
        color: "#8bc34a",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.HIGHEST.setValue(index, FUSION.lib.getMax(this.HIGH, index, this.PERIODS));
        };
    }),
  });
}
