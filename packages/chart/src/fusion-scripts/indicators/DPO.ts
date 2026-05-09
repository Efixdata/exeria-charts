import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDPOIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "dpoTitle",
    description: "dpoDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 7 },
    },

    outputs: {
      DPO: {
        type: "series",
        series: {
          seriesId: null,
          title: "dpoTitle",
          labels: ["value"],
          fields: ["DPOValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DPO",
        renderAs: "Line",
        dataField: "DPOValue",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var ma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
          if (close === null || ma === null) return;

          this.DPOValue.setValue(index, close - ma);
        };
    }),
  });
}
