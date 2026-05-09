import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createBBANDSWIDTHIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "bbandsWidthTitle",
    description: "bbandsWidthDescription",
    type: "indicators",
    newPane: true,

    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 20 },
      DEVIATIONS: {
        type: "double",
        name: "deviations",
        properties: { max: 10, min: 0, step: 0.1 },
        value: 2,
      },
    },

    outputs: {
      BBANDSWIDTH: {
        type: "series",
        series: {
          seriesId: null,
          title: "bbandsWidthTitle",
          labels: ["value"],
          fields: ["BBANDSWIDTH"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "BBANDSWIDTH",
        renderAs: "Line",
        dataField: "BBANDSWIDTH",
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
          if (this.CLOSE.getValue(index) === null) return;

          var sma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
          var std = FUSION.lib.getStdDev(this.CLOSE, index, this.PERIODS);
          std = std * this.DEVIATIONS;
          if (sma === null || std === null) return;

          const upperBand = sma + std;
          const lowerBand = sma - std;

          this.BBANDSWIDTH.setValue(index, (upperBand - lowerBand) / sma);
        };
    }),
  });
}
