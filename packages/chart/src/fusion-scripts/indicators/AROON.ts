import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createAROONIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "aroonTitle",
    description: "aroonDescription",
    type: "indicators",
    newPane: true,

    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 25 },
    },

    outputs: {
      AROONUP: {
        type: "series",
        series: {
          seriesId: null,
          title: "aroonUp",
          labels: ["value"],
          fields: ["AROONUP"],
          data: null,
        },
      },
      AROONDOWN: {
        type: "series",
        series: {
          seriesId: null,
          title: "aroonDown",
          labels: ["value"],
          fields: ["AROONDOWN"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "AROONUP",
        renderAs: "Line",
        dataField: "AROONUP",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "AROONDOWN",
        renderAs: "Line",
        dataField: "AROONDOWN",
        color: "#03a9f4",
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
          if (this.HIGH.getValue(index) === null || index < this.PERIODS - 1) return;

          let aroonUp =
            100 *
            ((this.PERIODS - index + FUSION.lib.getMaxIndex(this.HIGH, index, this.PERIODS)) /
              this.PERIODS);
          this.AROONUP.setValue(index, aroonUp);

          let aroonDown =
            100 *
            ((this.PERIODS - index + FUSION.lib.getMinIndex(this.LOW, index, this.PERIODS)) /
              this.PERIODS);
          this.AROONDOWN.setValue(index, aroonDown);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
