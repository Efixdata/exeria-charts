import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createHMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "hmaTitle",
    description: "hmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 196, min: 4 }, value: 25 },
    },

    outputs: {
      HMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "hmaTitle",
          labels: ["value"],
          fields: ["HMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "HMA",
        renderAs: "Line",
        dataField: "HMAValue",
        color: "#3f51b5",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["DIFFWMA"]);
          this.DIFFWMA = this.context.getRawSeriesWrapper(this.helper, "DIFFWMA");

          this.sqrtPeriod = Math.floor(Math.sqrt(this.PERIODS));
          this.halfPeriod = Math.floor(this.PERIODS / 2);
        };

        this.calculate = function (this: any, index: any) {
          var wman2 = 2 * FUSION.lib.getWMA(this.CLOSE, index, this.halfPeriod);
          var wman = FUSION.lib.getWMA(this.CLOSE, index, this.PERIODS);
          if (wman === null || wman2 === null) return;
          this.DIFFWMA.setValue(index, wman2 - wman);
          this.HMAValue.setValue(index, FUSION.lib.getWMA(this.DIFFWMA, index, this.sqrtPeriod));
        };
    }),
  });
}
