import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCORRELATIONCOEFFICIENTIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "correlationCoefficientTitle",
    description: "correlationCoefficientDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      CLOSE2: { type: "series", name: "priceClose2", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "period", properties: { max: 200, min: 1 }, value: 20 },
    },
    outputs: {
      CORRELATIONCOEFFICIENT: {
        type: "series",
        series: {
          seriesId: null,
          title: "correlationCoefficientTitle",
          labels: ["value"],
          fields: ["CORRELATIONCOEFFICIENT"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CORRELATIONCOEFFICIENT",
        renderAs: "Line and Histogram",
        dataField: "CORRELATIONCOEFFICIENT",
        color: "#e91e63",
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

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "SQUAREDCLOSE",
            "SQUAREDCLOSE2",
            "MULTIPLIEDCLOSES",
            "CLOSESUM",
            "CLOSE2SUM",
            "SQUAREDCLOSESUM",
            "SQUAREDCLOSE2SUM",
            "MULTIPLIEDCLOSESSUM",
          ]);

          this.SQUAREDCLOSE = this.context.getRawSeriesWrapper(this.helper, "SQUAREDCLOSE");
          this.SQUAREDCLOSE2 = this.context.getRawSeriesWrapper(this.helper, "SQUAREDCLOSE2");
          this.MULTIPLIEDCLOSES = this.context.getRawSeriesWrapper(this.helper, "MULTIPLIEDCLOSES");
          this.CLOSESUM = this.context.getRawSeriesWrapper(this.helper, "CLOSESUM");
          this.CLOSE2SUM = this.context.getRawSeriesWrapper(this.helper, "CLOSE2SUM");
          this.SQUAREDCLOSESUM = this.context.getRawSeriesWrapper(this.helper, "SQUAREDCLOSESUM");
          this.SQUAREDCLOSE2SUM = this.context.getRawSeriesWrapper(this.helper, "SQUAREDCLOSE2SUM");
          this.MULTIPLIEDCLOSESSUM = this.context.getRawSeriesWrapper(
            this.helper,
            "MULTIPLIEDCLOSESSUM"
          );
        };

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var close2 = this.CLOSE2.getValue(index);

          this.SQUAREDCLOSE.setValue(index, close * close);
          this.SQUAREDCLOSE2.setValue(index, close2 * close2);
          this.MULTIPLIEDCLOSES.setValue(index, close * close2);

          this.CLOSESUM.setValue(
            index,
            FUSION.lib.getSum(this.CLOSE, index, this.PERIOD, this.CLOSESUM)
          );
          this.CLOSE2SUM.setValue(
            index,
            FUSION.lib.getSum(this.CLOSE2, index, this.PERIOD, this.CLOSE2SUM)
          );
          this.SQUAREDCLOSESUM.setValue(
            index,
            FUSION.lib.getSum(this.SQUAREDCLOSE, index, this.PERIOD, this.SQUAREDCLOSESUM)
          );
          this.SQUAREDCLOSE2SUM.setValue(
            index,
            FUSION.lib.getSum(this.SQUAREDCLOSE2, index, this.PERIOD, this.SQUAREDCLOSE2SUM)
          );
          this.MULTIPLIEDCLOSESSUM.setValue(
            index,
            FUSION.lib.getSum(this.MULTIPLIEDCLOSES, index, this.PERIOD, this.MULTIPLIEDCLOSESSUM)
          );

          if (close == null || close2 == null || index < this.PERIOD) return;

          var closeAverage = this.CLOSESUM.getValue(index) / this.PERIOD;
          var close2Average = this.CLOSE2SUM.getValue(index) / this.PERIOD;
          var squaredCloseAverage = this.SQUAREDCLOSESUM.getValue(index) / this.PERIOD;
          var squaredClose2Average = this.SQUAREDCLOSE2SUM.getValue(index) / this.PERIOD;
          var multipliedClosesAverage = this.MULTIPLIEDCLOSESSUM.getValue(index) / this.PERIOD;

          var closeVariance = squaredCloseAverage - closeAverage * closeAverage;
          var close2Variance = squaredClose2Average - close2Average * close2Average;
          var covariance = multipliedClosesAverage - closeAverage * close2Average;
          var correlationCoefficient = covariance / Math.sqrt(closeVariance * close2Variance);

          this.CORRELATIONCOEFFICIENT.setValue(index, correlationCoefficient);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
