import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMMAIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "mmaTitle",
    description: "mmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 3 },
    },

    outputs: {
      MMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "mmaTitle",
          labels: ["value"],
          fields: ["MMA"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MMA",
        renderAs: "Line",
        dataField: "MMA",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var MMAController: FusionScriptControllerConstructor = function (
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
          this.MMA.setValue(index, FUSION.lib.getMMA(this.CLOSE, index, this.PERIODS, this.MMA));
        };
      };

      return new MMAController(context, inputs, outputs);
    },
  };
}
