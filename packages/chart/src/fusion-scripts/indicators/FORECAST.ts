import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createFORECASTIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "forecastTitle",
    description: "forecastDescription",
    subscriptionPack: "importerExporterTools",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: {
        type: "integer",
        name: "periodsForAnalysis",
        properties: { max: 999, min: 0 },
        value: 250,
      },
      SHIFT: { type: "integer", name: "shift", properties: { max: 999, min: 0 }, value: 0 },
      PROGNOSIS_PERIODS: {
        type: "integer",
        name: "prognosisPeriods",
        properties: { max: 999, min: 0 },
        value: 250,
      },
      PROBABILITY: {
        type: "double",
        name: "probability",
        properties: { max: 100, min: 0, step: 1 },
        value: 50,
      },
    },

    outputs: {
      FORECAST: {
        type: "series",
        series: {
          seriesId: null,
          title: "forecastTitle",
          labels: ["upper", "lower"],
          fields: ["ForecastUpper", "ForecastLower"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FORECAST",
        renderAs: "Band",
        upperField: "ForecastUpper",
        lowerField: "ForecastLower",
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
        };

        this.calculate = function (this: any, index: any) {
          var shiftedIndex = this.CLOSE.getSeriesLength() - 1 - this.SHIFT;

          if (index >= shiftedIndex - this.PERIODS) {
            var returnRate =
              (this.CLOSE.getValue(index) - this.CLOSE.getValue(index - 1)) /
              this.CLOSE.getValue(index - 1);
            this.returnRate.setValue(index, returnRate);
          }

          if (index === shiftedIndex) {
            var PROBABILITY = (1 - this.PROBABILITY / 100) / 2;
            var average = FUSION.lib.getMA(this.returnRate, index, this.PERIODS);
            var standardDeviation = FUSION.lib.getStdDev(this.returnRate, index, this.PERIODS);
            var valueAtRisk = FUSION.lib.inverseNormalDistribution(
              PROBABILITY,
              average,
              standardDeviation
            );

            this.ForecastUpper.setValue(index, this.CLOSE.getValue(index));
            this.ForecastLower.setValue(index, this.CLOSE.getValue(index));

            for (var i = 1; i <= this.PROGNOSIS_PERIODS; ++i) {
              var valueAtRiskValue = valueAtRisk * Math.sqrt(i) * this.CLOSE.getValue(index);
              var upper = this.CLOSE.getValue(index) - valueAtRiskValue;
              var lower = this.CLOSE.getValue(index) + valueAtRiskValue;

              this.ForecastUpper.setValue(index + i, upper);
              this.ForecastLower.setValue(index + i, lower);
            }
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
