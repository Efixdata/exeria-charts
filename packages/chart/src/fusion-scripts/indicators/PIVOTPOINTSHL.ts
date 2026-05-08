import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createPIVOTPOINTSHLIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "pivotPointHLTitle",
    description: "pivotPointHLDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 1 }, value: 5 },
    },

    outputs: {
      PIVOTPOINTSHL: {
        type: "series",
        series: {
          seriesId: null,
          title: "pivotPointHLTitle",
          labels: ["signal"],
          fields: ["PivotPointsHL"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "PIVOTPOINTSHL",
        renderAs: "",
        dataField: "PivotPointsHL",
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
          this.PivotPointsHL.setValue(index, FUSION.DO_NOTHING);

          if (FUSION.lib.isHighBar(this.HIGH, index, this.PERIODS)) {
            this.PivotPointsHL.setValue(index, FUSION.SELL);
          } else if (FUSION.lib.isLowBar(this.LOW, index, this.PERIODS)) {
            this.PivotPointsHL.setValue(index, FUSION.BUY);
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
