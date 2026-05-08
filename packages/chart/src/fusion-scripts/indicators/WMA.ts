import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createWMAIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "wmaTitle",
    description: "wmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
    },

    outputs: {
      WMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "wmaTitle",
          labels: ["value"],
          fields: ["WMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "WMA",
        renderAs: "Line",
        dataField: "WMAValue",
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
      var WMAController: FusionScriptControllerConstructor = function (
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
          this.WMAValue.setValue(index, FUSION.lib.getWMA(this.CLOSE, index, this.PERIODS));
        };
      };

      return new WMAController(context, inputs, outputs);
    },
  };
}
