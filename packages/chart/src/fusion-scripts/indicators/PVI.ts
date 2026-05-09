import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createPVIIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "pviTitle",
    description: "pviDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },
    outputs: {
      PVI: {
        type: "series",
        series: {
          seriesId: null,
          title: "pviTitle",
          labels: ["value"],
          fields: ["PVIValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "PVI",
        renderAs: "Line",
        dataField: "PVIValue",
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
          var lastVolume = this.VOLUME.getValue(index - 1);
          var lastPVI = this.PVIValue.getValue(index - 1) || 1;

          if (
            close === null ||
            lastClose === null ||
            volume === null ||
            lastVolume === null ||
            volume < lastVolume
          ) {
            this.PVIValue.setValue(index, lastPVI);
          } else {
            var pvi = ((close - lastClose) / lastClose) * lastPVI + lastPVI;
            this.PVIValue.setValue(index, pvi);
          }
        };
    }),
  });
}
