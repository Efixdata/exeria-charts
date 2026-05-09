import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createSTANDARDDEVIATIONIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "standardDeviationTitle",
    description: "standardDeviationDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      PRICE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
    },

    outputs: {
      STANDARDDEVIATION: {
        type: "series",
        series: {
          seriesId: null,
          title: "standardDeviationTitle",
          labels: ["value"],
          fields: ["STANDARDDEVIATION"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "STANDARDDEVIATION",
        renderAs: "Line",
        dataField: "STANDARDDEVIATION",
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
          this.STANDARDDEVIATION.setValue(
            index,
            FUSION.lib.getStdDev(this.PRICE, index, this.PERIODS)
          );
        };
    }),
  });
}
