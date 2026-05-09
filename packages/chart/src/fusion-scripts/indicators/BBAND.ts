import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createBBANDIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "bbandTitle",
    description: "bbandDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 15 },
      DEVIATIONS: {
        type: "double",
        name: "deviations",
        properties: { max: 10, min: 0, step: 0.1 },
        value: 2.5,
      },
    },

    outputs: {
      BBAND: {
        type: "series",
        series: {
          seriesId: null,
          title: "bbandTitle",
          labels: ["upper", "lower", "middle"],
          fields: ["BBUpper", "BBLower", "BBMiddle"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "BBAND",
        renderAs: "Band",
        upperField: "BBUpper",
        lowerField: "BBLower",
        color: "#5b6f8b",
        width: 1,
        dash: [0, 0],
      },
      {
        type: "SeriesObject",
        dataLink: "BBAND",
        renderAs: "Line",
        dataField: "BBMiddle",
        color: "#425166",
        width: 1,
        dash: [0, 0],
        priceTag: false,
        priceLine: false,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var sma = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
          var std = FUSION.lib.getStdDev(this.CLOSE, index, this.PERIODS);
          std = std * this.DEVIATIONS;
          if (sma === null || std === null) return;

          this.BBUpper.setValue(index, sma + std);
          this.BBLower.setValue(index, sma - std);
          this.BBMiddle.setValue(index, sma);
        };
    }),
  });
}
