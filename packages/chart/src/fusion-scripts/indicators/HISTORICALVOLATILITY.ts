import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createHISTORICALVOLATILITYIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "historicalVolatilityTitle",
    description: "historicalVolatilityDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 10 },
      DIVISOR: {
        type: "integer",
        name: "divisor",
        properties: { max: 999999, min: 1 },
        value: 252,
      },
    },

    outputs: {
      HISTORICALVOLATILITY: {
        type: "series",
        series: {
          seriesId: null,
          title: "historicalVolatilityTitle",
          labels: ["value"],
          fields: ["HISTORICALVOLATILITY"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "HISTORICALVOLATILITY",
        renderAs: "Line",
        dataField: "HISTORICALVOLATILITY",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["X"]);
          this.X = this.context.getRawSeriesWrapper(this.helper, "X");
        };

        this.calculate = function (this: any, index: any) {
          var x = this.CLOSE.getValue(index) / this.CLOSE.getValue(index - 1) - 1;
          this.X.setValue(index, x);

          if (index < this.PERIODS) return;

          var std = FUSION.lib.getStdDev(this.X, index, this.PERIODS);
          var volatility = 100 * Math.sqrt(this.DIVISOR) * std;
          this.HISTORICALVOLATILITY.setValue(index, volatility);
        };
    }),
  });
}
