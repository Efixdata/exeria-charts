import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSHARPERATIOIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "sharpeRatioTitle",
    description: "sharpeRatioDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      EL: { type: "series", name: "equityLine", properties: { def: "EQUITY" }, value: null },
      RORPERIODS: {
        type: "integer",
        name: "rorPeriods",
        properties: { max: 200, min: 0 },
        value: 21,
      },
      PERIODS: {
        type: "integer",
        name: "sharpePeriods",
        properties: { max: 999, min: 0 },
        value: 220,
      },
      RF: {
        type: "integer",
        name: "riskFreeRateOfReturn",
        properties: { max: 200, min: 0 },
        value: 0,
      },
    },

    outputs: {
      SHARPERATIO: {
        type: "series",
        series: {
          seriesId: null,
          title: "sharpeRatioTitle",
          labels: ["value", "stddev", "ror"],
          fields: ["SHARPERATIO", "STD", "ROR"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "SHARPERATIO",
        renderAs: "Line",
        dataField: "SHARPERATIO",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "SHARPERATIO",
        renderAs: "Line",
        dataField: "STD",
        color: "#03a9f4",
        width: 1.5,
        dash: [2, 2],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "SHARPERATIO",
        renderAs: "Line",
        dataField: "ROR",
        color: "#ee4336",
        width: 1.5,
        dash: [],
        priceTag: false,
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

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["RATEOFRETURN", "RATEOFRETURNSUM", "STD"]);
          this.RATEOFRETURN = this.context.getRawSeriesWrapper(this.helper, "RATEOFRETURN");
          this.RATEOFRETURNSUM = this.context.getRawSeriesWrapper(this.helper, "RATEOFRETURNSUM");
        };

        this.calculate = function (this: any, index: any) {
          const el = this.EL.getValue(index);
          const prevEl = this.EL.getValue(index - this.RORPERIODS);

          if (!el || !prevEl) return;

          const rateOfReturn = (el - prevEl) / prevEl;
          this.RATEOFRETURN.setValue(index, rateOfReturn);

          const rateOfReturnSum = FUSION.lib.getSum(
            this.RATEOFRETURN,
            index,
            this.PERIODS,
            this.RATEOFRETURNSUM
          );
          this.RATEOFRETURNSUM.setValue(index, rateOfReturnSum);

          const averageRateOfReturn = rateOfReturnSum / this.PERIODS;
          const std = FUSION.lib.getStdDev(this.RATEOFRETURN, index, this.PERIODS);
          const sharpeRatio = (averageRateOfReturn - this.RF / 100) / std;

          if (index < this.PERIODS + this.RORPERIODS) return;

          this.ROR.setValue(index, averageRateOfReturn);
          this.STD.setValue(index, std);
          this.SHARPERATIO.setValue(index, sharpeRatio);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
