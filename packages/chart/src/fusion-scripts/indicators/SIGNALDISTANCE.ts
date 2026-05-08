import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSIGNALDISTANCEIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "signalDistanceTitle",
    description: "signalDistanceDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      STRATEGY: { type: "series", name: "strategy", properties: {}, value: null },
    },

    outputs: {
      DISTANCE: {
        type: "series",
        series: {
          seriesId: null,
          title: "signalDistanceTitle",
          labels: ["value"],
          fields: ["SignalDistanceValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DISTANCE",
        renderAs: "Line",
        dataField: "SignalDistanceValue",
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

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["lastSignal"]);
          this.lastSignal = this.context.getRawSeriesWrapper(this.helper, "lastSignal");
        };

        this.onModify = function (this: any) {
          this.init();
        };

        this.calculate = function (this: any, index: any) {
          var lastSignal = this.lastSignal.getValue(index - 1);

          if (this.STRATEGY.getValue(index)) {
            this.lastSignal.setValue(index, index);
          } else {
            this.lastSignal.setValue(index, lastSignal);
          }

          if (lastSignal !== null) {
            this.SignalDistanceValue.setValue(index, index - lastSignal);
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
