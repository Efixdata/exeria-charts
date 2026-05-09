import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createVOLUMEIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "volumeTitle",
    description: "volumeDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "v" }, value: null },
    },

    outputs: {
      VOLUME: {
        type: "series",
        series: {
          seriesId: null,
          title: "volumeTitle",
          labels: ["value"],
          fields: ["VOLUME"],
          precisions: [2],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "VOLUME",
        renderAs: "Volume Histogram",
        renderLegend: false,
        dataField: "VOLUME",
        color: "#f44336",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.VOLUME.setValue(index, this.CLOSE.getValue(index));
        };
    }),
  });
}
