import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createFORCEINDEXIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "forceIndexTitle",
    description: "forceIndexDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },
    outputs: {
      FI: {
        type: "series",
        series: {
          seriesId: null,
          title: "forceIndexTitle",
          labels: ["value"],
          fields: ["ForceIndex"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FI",
        renderAs: "Line",
        dataField: "ForceIndex",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
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

          if (close === null || lastClose === null || volume === null) {
            return;
          }

          var forceIndex = volume * (close - lastClose);
          this.ForceIndex.setValue(index, forceIndex);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
