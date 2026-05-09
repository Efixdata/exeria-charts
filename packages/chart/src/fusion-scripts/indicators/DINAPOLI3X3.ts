import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDINAPOLI3X3IndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "diNapoli3x3Title",
    description: "diNapoli3x3Description",
    type: "indicators",
    subscriptionPack: "diNapoliTools",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
    },
    outputs: {
      "DiNapoli 3X3": {
        type: "series",
        series: {
          seriesId: null,
          title: "diNapoli3x3Title",
          labels: ["value"],
          fields: ["DiNapoli3X3Value"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DiNapoli 3X3",
        renderAs: "Line",
        dataField: "DiNapoli3X3Value",
        color: "#0361f4",
        width: 1.5,
        dash: [],
        priceTag: true,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {
        this.PERIODS = 3;

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.DiNapoli3X3Value.setValue(
            index + this.PERIODS,
            FUSION.lib.getMA(this.CLOSE, index, this.PERIODS)
          );
        };
    }),
  });
}
