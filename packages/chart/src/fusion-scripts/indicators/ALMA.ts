import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createALMAIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "almaTitle",
    description: "almaDescription",
    type: "indicators",
    newPane: false,

    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
      OFFSET: { type: "double", name: "offset", properties: { max: 200, min: 0 }, value: 0.85 },
      SIGMA: { type: "integer", name: "sigma", properties: { max: 200, min: 0 }, value: 6 },
    },

    outputs: {
      ALMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "almaTitle",
          labels: ["value"],
          fields: ["ALMA"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ALMA",
        renderAs: "Line",
        dataField: "ALMA",
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
          if (this.CLOSE.getValue(index) === null || index < this.PERIODS - 1) return;

          let eq = 0;
          let wtd = 0;
          let wtdSum = 0;
          let wtdCum = 0;

          for (let i = this.PERIODS - 1; i > 0; --i) {
            eq = -1 * (Math.pow(i - this.OFFSET, 2) / Math.pow(this.SIGMA, 2));
            wtd = Math.exp(eq);
            wtdSum += wtd * this.CLOSE.getValue(index - i + 1);
            wtdCum += wtd;
          }

          this.ALMA.setValue(index, wtdSum / wtdCum);
        };
    }),
  });
}
