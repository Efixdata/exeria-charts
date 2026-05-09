import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createFORCEINDEXIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "forceIndexTitle",
    description: "forceIndexDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },
    outputs: {
      FI: {
        type: "series",
        series: {
          seriesId: null,
          title: "forceIndexTitle",
          labels: ["value"],
          fields: ["ForceIndex"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FI",
        renderAs: "Line",
        dataField: "ForceIndex",
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
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);
          var volume = this.VOLUME.getValue(index);

          if (close === null || lastClose === null || volume === null) {
            return;
          }

          var forceIndex = volume * (close - lastClose);
          this.ForceIndex.setValue(index, forceIndex);
        };
    }),
  });
}
