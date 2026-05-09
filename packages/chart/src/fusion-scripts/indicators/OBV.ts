import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createOBVIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "obvTitle",
    description: "obvDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },
    outputs: {
      OBV: {
        type: "series",
        series: {
          seriesId: null,
          title: "obvTitle",
          labels: ["value"],
          fields: ["OBVValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "OBV",
        renderAs: "Line",
        dataField: "OBVValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);
          var volume = this.VOLUME.getValue(index);
          var lastOBV = this.OBVValue.getValue(index - 1) || 0;

          if (close === null || lastClose === null || volume === null) return;

          if (close > lastClose) {
            this.OBVValue.setValue(index, lastOBV + volume);
          } else if (close < lastClose) {
            this.OBVValue.setValue(index, lastOBV - volume);
          } else {
            this.OBVValue.setValue(index, lastOBV);
          }
        };
    }),
  });
}
