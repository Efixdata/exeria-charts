import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createFORWARDIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "forwardTitle",
    description: "forwardDescription",
    subscriptionPack: "importerExporterTools",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 999, min: 0 }, value: 365 },
      INTEREST1: {
        type: "double",
        name: "interest1",
        properties: { max: 999, min: -999, step: 0.1 },
        value: 3,
      },
      INTEREST2: {
        type: "double",
        name: "interest2",
        properties: { max: 999, min: -999, step: 0.1 },
        value: 1,
      },
    },

    outputs: {
      FORWARD: {
        type: "series",
        series: {
          seriesId: null,
          title: "forwardTitle",
          labels: ["value"],
          fields: ["ForwardValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FORWARD",
        renderAs: "Line",
        dataField: "ForwardValue",
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
          var INTEREST1 = this.INTEREST1 / 100;
          var INTEREST2 = this.INTEREST2 / 100;
          var value =
            this.CLOSE.getValue(index) *
            Math.pow(Math.E, ((INTEREST2 - INTEREST1) * this.PERIODS) / 365);
          this.ForwardValue.setValue(index, value);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
