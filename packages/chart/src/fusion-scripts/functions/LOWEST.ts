import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createLOWESTFunctionScript(FUSION: CoreFusionStatic) {
  return {
    title: "lowestTitle",
    description: "lowestDescription",
    type: "functions",
    newPane: false,
    inputs: {
      LOW: { type: "series", name: "price", properties: { def: "l" }, value: null },
      PERIODS: {
        type: "integer",
        name: "period",
        properties: { def: 25, max: 100, min: 0 },
        value: 25,
      },
    },

    outputs: {
      LOWEST: {
        type: "series",
        series: {
          seriesId: null,
          title: "lowestTitle",
          labels: ["value"],
          fields: ["LOWEST"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "LOWEST",
        renderAs: "Line",
        dataField: "LOWEST",
        color: "#ff5722",
        width: 1.5,
        dash: [],
      },
    ],
    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var LOWESTController: FusionScriptControllerConstructor = function (
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
          this.LOWEST.setValue(index, FUSION.lib.getMin(this.LOW, index, this.PERIODS));
        };
      };

      return new LOWESTController(context, inputs, outputs);
    },
  };
}
