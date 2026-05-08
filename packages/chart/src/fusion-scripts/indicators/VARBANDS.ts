import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createVARBANDSIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "varbandsTitle",
    description: "varbandsDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "Price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "Periods", properties: { max: 200, min: 0 }, value: 10 },
      PROGNOSIS_PERIODS: {
        type: "integer",
        name: "Prognosis periods",
        properties: { max: 200, min: 0 },
        value: 50,
      },
      PROBABILITY_PERCENT: {
        type: "double",
        name: "Probability",
        properties: { max: 999, min: -999, step: 0.1 },
        value: 95,
      },
    },

    outputs: {
      VARBANDS: {
        type: "series",
        series: {
          seriesId: null,
          title: "varbandsTitle",
          labels: ["upper", "upper"],
          fields: ["VarbandsUpper", "VarbandsLower"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "VARBANDS",
        renderAs: "Band",
        upperField: "VarbandsUpper",
        lowerField: "VarbandsLower",
        color: "#5b6f8b",
        width: 1,
        dash: [0, 0],
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

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["returnRate"]);
          this.returnRate = this.context.getRawSeriesWrapper(this.helper, "returnRate");
          this.PROBABILITY = (1 - this.PROBABILITY_PERCENT / 100) / 2;
        };

        this.calculate = function (this: any, index: any) {
          this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

          if (index === this.CLOSE.getSeriesLength() - 1) {
            for (var i = 0; i <= this.PROGNOSIS_PERIODS; ++i) {
              var values = FUSION.lib.getForecastAverage(
                this.CLOSE,
                this.returnRate,
                index + i,
                this.PERIODS,
                this.PROGNOSIS_PERIODS,
                this.PROBABILITY
              );
              this.VarbandsUpper.setValue(index + i, values.upper);
              this.VarbandsLower.setValue(index + i, values.lower);
            }
          } else if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
            var values = FUSION.lib.getForecastAverage(
              this.CLOSE,
              this.returnRate,
              index,
              this.PERIODS,
              this.PROGNOSIS_PERIODS,
              this.PROBABILITY
            );

            this.VarbandsUpper.setValue(index, values.upper);
            this.VarbandsLower.setValue(index, values.lower);
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
