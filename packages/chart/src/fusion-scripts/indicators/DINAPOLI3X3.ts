import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDINAPOLI3X3IndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "diNapoli3x3Title",
    description: "diNapoli3x3Description",
    type: "indicators",
    subscriptionPack: "diNapoliTools",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
    },
    outputs: {
      "DiNapoli 3X3": {
        type: "series",
        series: {
          seriesId: null,
          title: "diNapoli3x3Title",
          labels: ["value"],
          fields: ["DiNapoli3X3Value"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DiNapoli 3X3",
        renderAs: "Line",
        dataField: "DiNapoli3X3Value",
        color: "#0361f4",
        width: 1.5,
        dash: [],
        priceTag: true,
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var DiNapoli3x3Controller: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;
        this.PERIODS = 3;

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.DiNapoli3X3Value.setValue(
            index + this.PERIODS,
            FUSION.lib.getMA(this.CLOSE, index, this.PERIODS)
          );
        };
      };

      return new DiNapoli3x3Controller(context, inputs, outputs);
    },
  };
}
