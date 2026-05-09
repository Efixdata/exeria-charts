import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createHLINEIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "hlineTitle",
    description: "hlineDescription",
    type: "indicators",
    newPane: false,
    quickAdd: false,
    inputs: {
      VALUE: {
        type: "double",
        name: "value",
        properties: { max: 2000000, min: -2000000 },
        value: 1,
      },
    },

    outputs: {
      HLINE: {
        type: "series",
        series: {
          seriesId: null,
          title: "hlineTitle",
          labels: ["value"],
          fields: ["HLINEValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "HLINE",
        renderAs: "Line",
        dataField: "HLINEValue",
        color: "#ffc107",
        width: 1,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.HLINEValue.setValue(index, this.VALUE);
        };
    }),
  });
}
