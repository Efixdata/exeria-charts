import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDIFFERStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "buySellSizeTitle",
    description: "buySellSizeTitle",
    type: "strategies",
    newPane: true,
    info: [{ description: "buySellSizeInfo", image: "Buy-Sell-Size.svg" }],
    inputs: {
      PS: { type: "series", name: "buySellSizePs", properties: {}, value: null },
    },

    outputs: {
      DIFFER: {
        type: "series",
        series: {
          seriesId: null,
          title: "buySellSizeTitle",
          labels: ["value"],
          fields: ["Differ"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "DIFFER",
        renderAs: "",
        dataField: "Differ",
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
      var DIFFERController: FusionScriptControllerConstructor = function (
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
          this.Differ.setValue(INDEX, 0);
          this.Differ.setStrength(INDEX, 0);

          this.psPrev = 0;
          this.ps = 0;

          if (INDEX > 0) this.psPrev = this.PS.getValue(INDEX - 1);

          this.ps = this.PS.getValue(INDEX);
          if (this.ps === null || this.psPrev === null) return;

          if (Math.abs(this.ps - this.psPrev) > 0) {
            if (this.ps - this.psPrev > 0) {
              this.Differ.setValue(INDEX, FUSION.BUY);
              this.Differ.setStrength(INDEX, Math.abs(this.ps - this.psPrev));
            } else if (this.ps - this.psPrev < 0) {
              this.Differ.setValue(INDEX, FUSION.SELL);
              this.Differ.setStrength(INDEX, Math.abs(this.ps - this.psPrev));
            }
          } else {
            this.Differ.setValue(INDEX, 0);
            this.Differ.setStrength(INDEX, 0);
          }
        };
      };

      return new DIFFERController(context, inputs, outputs);
    },
  };
}
