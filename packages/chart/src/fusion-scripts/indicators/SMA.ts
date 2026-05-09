import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createSMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "smaTitle",
    description: "smaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
    },

    outputs: {
      SMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "smaTitle",
          labels: ["value"],
          fields: ["SMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "SMA",
        renderAs: "Line",
        dataField: "SMAValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));
        };
    }),
  });
}
