import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createBBANDSPERCENTIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "bbandsPercentTitle",
    description: "bbandsPercentDescription",
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
      UPPERBAND: {
        type: "double",
        name: "upperBand",
        properties: { max: 10, min: -10, step: 0.1 },
        value: 1,
      },
      LOWERBAND: {
        type: "double",
        name: "lowerBand",
        properties: { max: 10, min: -10, step: 0.1 },
        value: 0,
      },
    },

    outputs: {
      BBANDSPERCENT: {
        type: "series",
        series: {
          seriesId: null,
          title: "bbandsPercentTitle",
          labels: ["upper", "lower", "value"],
          fields: ["BBUpper", "BBLower", "BBMiddle"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "BBANDSPERCENT",
        renderAs: "Band",
        upperField: "BBUpper",
        lowerField: "BBLower",
        color: "#5b6f8b",
        width: 1,
        dash: [0, 0],
      },
      {
        type: "SeriesObject",
        dataLink: "BBANDSPERCENT",
        renderAs: "Line",
        dataField: "BBMiddle",
        color: "#03a9f4",
        width: 1,
        dash: [0, 0],
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

          this.BBUpper.setValue(index, this.UPPERBAND);
          this.BBLower.setValue(index, this.LOWERBAND);
          this.BBMiddle.setValue(
            index,
            (this.CLOSE.getValue(index) - lowerBand) / (upperBand - lowerBand)
          );
        };
    }),
  });
}
