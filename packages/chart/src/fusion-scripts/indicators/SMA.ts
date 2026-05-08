import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSMAIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "smaTitle",
    description: "smaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
    },

    outputs: {
      SMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "smaTitle",
          labels: ["value"],
          fields: ["SMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "SMA",
        renderAs: "Line",
        dataField: "SMAValue",
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
      var SMAController: FusionScriptControllerConstructor = function (
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
          this.SMAValue.setValue(index, FUSION.lib.getMA(this.CLOSE, index, this.PERIODS));
        };
      };

      return new SMAController(context, inputs, outputs);
    },
  };
}
