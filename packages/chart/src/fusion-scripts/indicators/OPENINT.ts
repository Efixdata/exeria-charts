import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createOPENINTIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "openintTitle",
    description: "openintDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "i" }, value: null },
    },

    outputs: {
      OPENINT: {
        type: "series",
        series: {
          seriesId: null,
          title: "openintTitle",
          labels: ["value"],
          fields: ["OPENINT"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "OPENINT",
        renderAs: "Line",
        dataField: "OPENINT",
        color: "#f44336",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.OPENINT.setValue(index, this.CLOSE.getValue(index));
        };
    }),
  });
}
