import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createREBOUNDStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "reboundTitle",
    description: "reboundTitle",
    type: "strategies",
    newPane: false,
    info: [
      { description: "reboundInfo1", image: "Rebound0.svg" },
      { description: "reboundInfo2", image: "Rebound1.svg" },
    ],
    inputs: {
      UPPER: { type: "series", name: "reboundUpper", properties: {}, value: null },
      LOWER: { type: "series", name: "reboundLower", properties: {}, value: null },
      VALUE: { type: "series", name: "cSeries", properties: {}, value: null },

      ONDN: {
        type: "list",
        name: "reboundOnUp",
        properties: {},
        list: ["Buy", "Sell", "Exit long", "Exit short", "Exit all", "Do nothing"],
        value: "Sell",
      },
      ONUP: {
        type: "list",
        name: "reboundOnDn",
        properties: {},
        list: ["Buy", "Sell", "Exit long", "Exit short", "Exit all", "Do nothing"],
        value: "Buy",
      },
    },

    outputs: {
      REBOUND: {
        type: "series",
        series: {
          seriesId: null,
          title: "reboundTitle",
          labels: ["reboundTitle"],
          fields: ["Rebound"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "REBOUND",
        renderAs: "",
        dataField: "Rebound",
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
      var REBOUNDController: FusionScriptControllerConstructor = function (
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

        this.calculate = function (this: any, INDEX: any) {
          this.Rebound.setValue(INDEX, 0);

          if (INDEX > 2) {
            this.Rebound.setStrength(INDEX, 1);

            if (
              this.VALUE.getValue(INDEX) === null ||
              this.UPPER.getValue(INDEX) === null ||
              this.LOWER.getValue(INDEX) === null ||
              this.UPPER.getValue(INDEX - 1) === null ||
              this.LOWER.getValue(INDEX - 1) === null ||
              this.VALUE.getValue(INDEX - 1) === null
            ) {
              return;
            }

            if (
              this.VALUE.getValue(INDEX) < this.UPPER.getValue(INDEX) &&
              this.VALUE.getValue(INDEX - 1) > this.UPPER.getValue(INDEX - 1)
            ) {
              var signal = -1;
              if (this.ONDN == "Buy") signal = FUSION.BUY;
              else if (this.ONDN == "Sell") signal = FUSION.SELL;
              else if (this.ONDN == "Exit long") signal = FUSION.EXIT_LONG;
              else if (this.ONDN == "Exit short") signal = FUSION.EXIT_SHORT;
              else if (this.ONDN == "Exit all") signal = FUSION.EXIT_ALL;
              else if (this.ONDN == "Do nothing") signal = FUSION.DO_NOTHING;

              this.Rebound.setValue(INDEX, signal);
            } else if (
              this.VALUE.getValue(INDEX) > this.LOWER.getValue(INDEX) &&
              this.VALUE.getValue(INDEX - 1) < this.LOWER.getValue(INDEX - 1)
            ) {
              var signal = 1;
              if (this.ONUP == "Buy") signal = FUSION.BUY;
              else if (this.ONUP == "Sell") signal = FUSION.SELL;
              else if (this.ONUP == "Exit long") signal = FUSION.EXIT_LONG;
              else if (this.ONUP == "Exit short") signal = FUSION.EXIT_SHORT;
              else if (this.ONUP == "Exit all") signal = FUSION.EXIT_ALL;
              else if (this.ONUP == "Do nothing") signal = FUSION.DO_NOTHING;
              this.Rebound.setValue(INDEX, signal);
            }
          }
        };
      };

      return new REBOUNDController(context, inputs, outputs);
    },
  };
}
