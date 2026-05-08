import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createEXCEEDStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "exceedTitle",
    description: "exceedDescription",
    type: "strategies",
    newPane: false,
    info: [
      { description: "exceedInfo1", image: "Exceed0.svg" },
      { description: "exceedInfo2", image: "Exceed1.svg" },
    ],
    inputs: {
      UPPER: { type: "series", name: "exceedUpper", properties: { def: "BBUpper" }, value: null },
      LOWER: { type: "series", name: "exceedLower", properties: { def: "BBLower" }, value: null },
      HIGH: { type: "series", name: "cSeries", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "dSeries", properties: { def: "l" }, value: null },
      ONDN: {
        type: "list",
        name: "exceedOnDn",
        properties: {},
        list: ["Buy", "Sell", "Exit long", "Exit short", "Exit all", "Do nothing"],
        value: "Sell",
      },
      ONUP: {
        type: "list",
        name: "exceedOnUp",
        properties: {},
        list: ["Buy", "Sell", "Exit long", "Exit short", "Exit all", "Do nothing"],
        value: "Buy",
      },
      SINGLE: { type: "boolean", name: "singleSignal", properties: {}, value: false },
    },

    outputs: {
      EXCEED: {
        type: "series",
        series: {
          seriesId: null,
          title: "exceedTitle",
          labels: ["signal"],
          fields: ["ExceedValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "EXCEED",
        renderAs: "",
        dataField: "ExceedValue",
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
      var EXCEEDController: FusionScriptControllerConstructor = function (
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
          this.ExceedValue.setValue(INDEX, 0);
          this.ExceedValue.setStrength(INDEX, 1);
          this.SIGNALSERIES.setValue(INDEX, 0);
          var upperBand = this.UPPER.getValue(INDEX);
          var lowerBand = this.LOWER.getValue(INDEX);
          var highValue = this.HIGH.getValue(INDEX);
          var lowValue = this.LOW.getValue(INDEX);

          if (upperBand === null || lowerBand === null || highValue === null || lowValue === null)
            return;

          if (highValue > upperBand) {
            var signal = -1;
            if (this.ONDN === "Buy") signal = FUSION.BUY;
            else if (this.ONDN === "Sell") signal = FUSION.SELL;
            else if (this.ONDN === "Exit long") signal = FUSION.EXIT_LONG;
            else if (this.ONDN === "Exit short") signal = FUSION.EXIT_SHORT;
            else if (this.ONDN === "Exit all") signal = FUSION.EXIT_ALL;
            else if (this.ONDN === "Do nothing") signal = FUSION.DO_NOTHING;

            this.SIGNALSERIES.setValue(INDEX, signal);

            if (this.SINGLE === true && INDEX > 0) {
              if (this.SIGNALSERIES.getValue(INDEX - 1) != signal)
                this.ExceedValue.setValue(INDEX, signal);
            } else this.ExceedValue.setValue(INDEX, signal);
          } else if (lowValue < lowerBand) {
            var signal = -1;
            if (this.ONUP === "Buy") signal = FUSION.BUY;
            else if (this.ONUP === "Sell") signal = FUSION.SELL;
            else if (this.ONUP === "Exit long") signal = FUSION.EXIT_LONG;
            else if (this.ONUP === "Exit short") signal = FUSION.EXIT_SHORT;
            else if (this.ONUP === "Exit all") signal = FUSION.EXIT_ALL;
            else if (this.ONUP === "Do nothing") signal = FUSION.DO_NOTHING;

            this.SIGNALSERIES.setValue(INDEX, signal);

            if (this.SINGLE === true && INDEX > 0) {
              if (this.SIGNALSERIES.getValue(INDEX - 1) != signal)
                this.ExceedValue.setValue(INDEX, signal);
            } else this.ExceedValue.setValue(INDEX, signal);
          }
        };
      };

      return new EXCEEDController(context, inputs, outputs);
    },
  };
}
