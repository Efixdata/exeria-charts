import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createPOSITIONStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "positionSizeTitle",
    description: "positionSizeTitle",
    type: "strategies",
    newPane: true,
    info: [{ description: "positionSizeInfo", image: "Position-Size.svg" }],
    inputs: {
      STRATEGY: { type: "series", name: "strategy", properties: {}, value: null },
      WEIGHT: { type: "double", name: "weight", properties: { step: 0.01 }, value: 1 },
      MULTIPLIER: {
        type: "conditional",
        name: "multiplier",
        properties: {},
        value: { type: "double", value: 1.0 },
      },
    },

    outputs: {
      POSITION: {
        type: "series",
        series: {
          seriesId: null,
          title: "positionSizeTitle",
          labels: ["value"],
          fields: ["Position"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "POSITION",
        renderAs: "Line",
        dataField: "Position",
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
      var POSITIONController: FusionScriptControllerConstructor = function (
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
          this.valuePrev = 0;
          this.strengthPrev = 0;
          this.signal = 0;
          this.strength = 0;
          this.mult = 0;

          if (INDEX > 0) {
            this.strengthPrev = this.Position.getStrength(INDEX - 1);
            this.valuePrev = this.Position.getValue(INDEX - 1);
          }
          this.Position.setValue(INDEX, this.valuePrev);
          this.Position.setStrength(INDEX, this.strengthPrev);

          if (this.STRATEGY.getValue(INDEX) === null) return;

          this.signal = Math.round(this.STRATEGY.getValue(INDEX));
          this.strength = this.STRATEGY.getStrength(INDEX);
          if (!this.strength) this.strength = 0;
          if (this.MULTIPLIER["type"] && this.MULTIPLIER["type"] == "double") {
            //double
            this.mult = this.MULTIPLIER["value"];
          } //series
          else this.mult = this.MULTIPLIER.getValue(INDEX);

          if (this.mult === null) return;

          if (this.signal == 0) {
            this.Position.setValue(INDEX, this.strengthPrev);
            this.Position.setStrength(INDEX, this.strengthPrev);
            //POSITION_SIZE.test("a");
          } else if (this.signal == FUSION.BUY) {
            this.Position.setValue(
              INDEX,
              this.strengthPrev + this.strength * this.mult * this.WEIGHT
            );
            this.Position.setStrength(
              INDEX,
              this.strengthPrev + this.strength * this.mult * this.WEIGHT
            );
            //POSITION_SIZE.test("b");
          } else if (this.signal == FUSION.SELL) {
            this.Position.setValue(
              INDEX,
              this.strengthPrev - this.strength * this.mult * this.WEIGHT
            );
            this.Position.setStrength(
              INDEX,
              this.strengthPrev - this.strength * this.mult * this.WEIGHT
            );
            //POSITION_SIZE.test("c");
          } else if (this.signal == FUSION.EXIT_LONG) {
            if (this.strengthPrev > 0) {
              this.Position.setValue(INDEX, 0);
              this.Position.setStrength(INDEX, 0);
            }
          } else if (this.signal == FUSION.EXIT_SHORT) {
            if (this.strengthPrev < 0) {
              this.Position.setValue(INDEX, 0);
              this.Position.setStrength(INDEX, 0);
            }
            //POSITION_SIZE.test("d");
          } else if (this.signal == FUSION.EXIT_ALL) {
            this.Position.setValue(INDEX, 0);
            this.Position.setStrength(INDEX, 0);
            //POSITION_SIZE.test("e");
          } else {
            this.Position.setValue(INDEX, this.strengthPrev);
            this.Position.setStrength(INDEX, this.strengthPrev);
            //POSITION_SIZE.test("f");
          }
        };
      };

      return new POSITIONController(context, inputs, outputs);
    },
  };
}
