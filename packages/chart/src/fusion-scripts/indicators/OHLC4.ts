import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createOHLC4IndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "ohlc4Title",
    description: "ohlc4Description",
    type: "indicators",
    newPane: false,
    inputs: {
      OPEN: { type: "series", name: "priceOpen", properties: { def: "o" }, value: null },
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
    },

    outputs: {
      OHLC4: {
        type: "series",
        series: {
          seriesId: null,
          title: "ohlc4Title",
          labels: ["value"],
          fields: ["OHLC4"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "OHLC4",
        renderAs: "Line",
        dataField: "OHLC4",
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
          this.OHLC4.setValue(
            index,
            (this.OPEN.getValue(index) +
              this.HIGH.getValue(index) +
              this.LOW.getValue(index) +
              this.CLOSE.getValue(index)) /
              4
          );
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
