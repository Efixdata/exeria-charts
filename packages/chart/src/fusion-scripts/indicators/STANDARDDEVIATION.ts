import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSTANDARDDEVIATIONIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "standardDeviationTitle",
    description: "standardDeviationDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      PRICE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
    },

    outputs: {
      STANDARDDEVIATION: {
        type: "series",
        series: {
          seriesId: null,
          title: "standardDeviationTitle",
          labels: ["value"],
          fields: ["STANDARDDEVIATION"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "STANDARDDEVIATION",
        renderAs: "Line",
        dataField: "STANDARDDEVIATION",
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
          this.STANDARDDEVIATION.setValue(
            index,
            FUSION.lib.getStdDev(this.PRICE, index, this.PERIODS)
          );
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
