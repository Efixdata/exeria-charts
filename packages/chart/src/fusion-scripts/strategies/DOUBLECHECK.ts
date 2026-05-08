import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDOUBLECHECKStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "doubleCheckTitle",
    description: "doubleCheckDescription",
    type: "strategies",
    newPane: false,
    info: [{ description: "doubleCheckInfo", image: "Double-Check.svg" }],
    inputs: {
      SECOND: { type: "series", name: "xStrategy", properties: {}, value: null },
      FIRST: { type: "series", name: "yStrategy", properties: {}, value: null },
      MATRIX: {
        type: "matrix",
        name: "mixingTable",
        properties: { readOnly: true },
        value: FUSION.createDoubleCheckMatrix(),
      },
    },

    outputs: {
      DOUBLE: {
        type: "series",
        series: {
          seriesId: null,
          title: "doubleCheckTitle",
          labels: ["doubleCheckTitle"],
          fields: ["Double"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "DOUBLE",
        renderAs: "",
        dataField: "Double",
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
      var DOUBLEController: FusionScriptControllerConstructor = function (
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
          this.Double.setValue(INDEX, 0);
          this.Double.setStrength(INDEX, 1);

          if (this.FIRST.getValue(INDEX) === null || this.SECOND.getValue(INDEX) === null) return;

          var firstSignalVal = Math.round(this.FIRST.getValue(INDEX));
          var secondSignalVal = Math.round(this.SECOND.getValue(INDEX));
          var signal1 = FUSION.signalValueToName(firstSignalVal);
          var signal2 = FUSION.signalValueToName(secondSignalVal);

          if (signal1 && signal2) {
            var signal3 = this.MATRIX[signal1][signal2];
            this.Double.setValue(INDEX, FUSION.signalNameToValue(signal3));
          }
        };
      };

      return new DOUBLEController(context, inputs, outputs);
    },
  };
}
