import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "dmaTitle",
    description: "dmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 3 },
      DISPLACEMENT: {
        type: "integer",
        name: "displacement",
        properties: { max: 200, min: 1 },
        value: 3,
      },
    },
    outputs: {
      DMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "dmaTitle",
          labels: ["value"],
          fields: ["DMA"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DMA",
        renderAs: "Line",
        dataField: "DMA",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          if (index < this.PERIODS) {
            return;
          } else if (index < this.DISPLACEMENT + this.PERIODS) {
            this.DMA.setValue(index + this.DISPLACEMENT, this.CLOSE.getValue(index));
          } else {
            this.DMA.setValue(
              index + this.DISPLACEMENT,
              FUSION.lib.getMA(this.CLOSE, index, this.PERIODS)
            );
          }
        };
    }),
  });
}
