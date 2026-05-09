import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createROCIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "rocTitle",
    description: "rocDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 12 },
      PERCMODE: { type: "boolean", name: "percentageMode", properties: {}, value: null },
    },

    outputs: {
      ROC: {
        type: "series",
        series: {
          seriesId: null,
          title: "rocDescription",
          labels: ["rocTitle"],
          fields: ["ROC"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ROC",
        renderAs: "Line",
        dataField: "ROC",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          if (this.CLOSE.getValue(index) === null) return;

          var dis = FUSION.lib.displace(this.CLOSE, index, this.PERIODS);

          if (dis === null) return;

          if (!this.PERCMODE) {
            this.ROC.setValue(index, this.CLOSE.getValue(index) - dis);
          } else {
            this.ROC.setValue(index, (100 * (this.CLOSE.getValue(index) - dis)) / dis);
          }
        };
    }),
  });
}
