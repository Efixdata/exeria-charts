import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createBBANDSWIDTHIndicatorScript(FUSION: CoreFusionStatic) {
  return {
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

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var Controller: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

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
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
