import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createOBVIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "obvTitle",
    description: "obvDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },
    outputs: {
      OBV: {
        type: "series",
        series: {
          seriesId: null,
          title: "obvTitle",
          labels: ["value"],
          fields: ["OBVValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "OBV",
        renderAs: "Line",
        dataField: "OBVValue",
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
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);
          var volume = this.VOLUME.getValue(index);
          var lastOBV = this.OBVValue.getValue(index - 1) || 0;

          if (close === null || lastClose === null || volume === null) return;

          if (close > lastClose) {
            this.OBVValue.setValue(index, lastOBV + volume);
          } else if (close < lastClose) {
            this.OBVValue.setValue(index, lastOBV - volume);
          } else {
            this.OBVValue.setValue(index, lastOBV);
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
