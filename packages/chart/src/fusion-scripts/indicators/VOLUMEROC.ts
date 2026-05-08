import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createVOLUMEROCIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "volumeRateOfChangeTitle",
    description: "volumeRateOfChangeDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 12 },
      PERCMODE: { type: "boolean", name: "percentageMode", properties: {}, value: true },
    },

    outputs: {
      VOLUMEROC: {
        type: "series",
        series: {
          seriesId: null,
          title: "volumeRateOfChangeTitle",
          labels: ["value"],
          fields: ["ROC"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "VOLUMEROC",
        renderAs: "Line",
        dataField: "ROC",
        color: "#00bcd4",
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
          if (this.VOLUME.getValue(index) === null) return;

          var dis = FUSION.lib.displace(this.VOLUME, index, this.PERIODS);
          if (dis === null) return;

          if (!this.PERCMODE) {
            this.ROC.setValue(index, this.VOLUME.getValue(index) - dis);
          } else {
            this.ROC.setValue(index, (100 * (this.VOLUME.getValue(index) - dis)) / dis);
          }
        };
      };
      return new Controller(context, inputs, outputs);
    },
  };
}
