import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMIXStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "selectiveSignalsTitle",
    description: "selectiveSignalsDescription",
    type: "strategies",
    newPane: false,
    info: [{ description: "selectiveSignalsInfo", image: "Selective-Signals.svg" }],
    inputs: {
      FIRST: { type: "series", name: "xStrategy", properties: {}, value: null },
      SECOND: { type: "series", name: "yStrategy", properties: {}, value: null },
      MATRIX: {
        type: "matrix",
        name: "mixingTable",
        properties: { readOnly: false },
        value: FUSION.createSelectiveSignalsMatrix(),
      },
    },

    outputs: {
      MIX: {
        type: "series",
        series: {
          seriesId: null,
          title: "selectiveSignalsTitle",
          labels: ["value"],
          fields: ["Mix"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "MIX",
        renderAs: "",
        dataField: "Mix",
        color: "#ff0000",
        width: 1,
        dash: [],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var MIXcontroller: FusionScriptControllerConstructor = function (
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
          this.helper = this.context.createSeries(["SIGNALSERIES"]);
          this.SIGNALSERIES = this.context.getRawSeriesWrapper(this.helper, "SIGNALSERIES");
        };

        this.calculate = function (this: any, INDEX: any) {
          this.Mix.setValue(INDEX, 0);
          this.Mix.setStrength(INDEX, 1);

          if (this.FIRST.getValue(INDEX) === null || this.SECOND.getValue(INDEX) === null) return;

          var firstSignalVal = Math.round(this.FIRST.getValue(INDEX));
          var secondSignalVal = Math.round(this.SECOND.getValue(INDEX));
          var signal1 = FUSION.signalValueToName(firstSignalVal);
          var signal2 = FUSION.signalValueToName(secondSignalVal);

          if (signal1 && signal2) {
            var signal3 = this.MATRIX[signal1][signal2];
            this.Mix.setValue(INDEX, FUSION.signalNameToValue(signal3));
          }
        };
      };

      return new MIXcontroller(context, inputs, outputs);
    },
  };
}
