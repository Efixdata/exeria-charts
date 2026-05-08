import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDOPIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "diNapoliOscillatorPredictorTitle",
    description: "diNapoliOscillatorPredictorDescription",
    subscriptionPack: "diNapoliTools",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      // 'PERIOD': { type: 'integer', name: 'periods', properties: { max: 100, min: 0 }, value: 7 },
      PERCENT: {
        type: "integer",
        name: "percent",
        properties: { def: 100, max: 999, min: 1 },
        value: 100,
      },
      LOOKBACKPERIODS: {
        type: "integer",
        name: "lookbackPeriods",
        properties: { def: 135, max: 999, min: 1 },
        value: 135,
      },
      PEAKSANDTHROUGHS: {
        type: "integer",
        name: "peaksAndThroughs",
        properties: { def: 3, max: 999, min: 1 },
        value: 3,
      },
      SHIFT: { type: "integer", name: "Shift", properties: { def: 1, max: 999, min: 0 }, value: 1 },
    },

    outputs: {
      DOP: {
        type: "series",
        series: {
          seriesId: null,
          title: "diNapoliOscillatorPredictorTitle",
          labels: ["diNapoliOscillatorPredictorHigh", "diNapoliOscillatorPredictorLow"],
          fields: ["High", "Low"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DOP",
        renderAs: "Line",
        dataField: "High",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "DOP",
        renderAs: "Line",
        dataField: "Low",
        color: "#03a9f4",
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
      var c: FusionScriptControllerConstructor = function (
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
            "peaks1",
            "peaks2",
            "troughs1",
            "troughs2",
            "peaksAverage",
            "throughsAverage",
          ]);
          this.peaks1 = this.context.getRawSeriesWrapper(this.helper, "peaks1");
          this.peaks2 = this.context.getRawSeriesWrapper(this.helper, "peaks2");
          this.throughs1 = this.context.getRawSeriesWrapper(this.helper, "throughs1");
          this.throughs2 = this.context.getRawSeriesWrapper(this.helper, "throughs2");
          this.peaksAverage = this.context.getRawSeriesWrapper(this.helper, "peaksAverage");
          this.throughsAverage = this.context.getRawSeriesWrapper(this.helper, "throughsAverage");
          this.PERIOD = 7;
        };

        this.calculate = function (this: any, index: any) {
          var ma7 = FUSION.lib.getMA(this.CLOSE, index, this.PERIOD);
          if (ma7 === null) return;
          var detrendOscillatorValue = this.CLOSE.getValue(index) - ma7;

          // Peaks
          if (detrendOscillatorValue > 0) {
            if (!this.peaks1.getValue(index - 1)) {
              this.peaks1.setValue(index, detrendOscillatorValue);
            } else {
              if (detrendOscillatorValue > this.peaks1.getValue(index - 1)) {
                this.peaks1.setValue(index, detrendOscillatorValue);
              } else {
                this.peaks1.setValue(index, this.peaks1.getValue(index - 1));
              }
            }
          } else {
            this.peaks1.setValue(index, null);
          }

          if (detrendOscillatorValue < 0) {
            this.peaks2.setValue(index, this.peaks1.getValue(index - 1));
          } else {
            this.peaks2.setValue(index, null);
          }

          // Throughs
          if (detrendOscillatorValue < 0) {
            if (detrendOscillatorValue < this.throughs1.getValue(index - 1)) {
              this.throughs1.setValue(index, detrendOscillatorValue);
            } else {
              this.throughs1.setValue(index, this.throughs1.getValue(index - 1));
            }
          } else {
            this.throughs1.setValue(index, null);
          }

          if (detrendOscillatorValue > 0) {
            this.throughs2.setValue(index, this.throughs1.getValue(index - 1));
          } else {
            this.throughs2.setValue(index, null);
          }

          // Peaks and Throughs Averages
          var peaksSum = 0;
          var throughsSum = 0;
          var minPeak = this.peaks1.getValue(index);
          var maxThrough = this.throughs1.getValue(index);

          for (var i = 0; i < this.PEAKSANDTHROUGHS; ++i) {
            var peak = FUSION.lib.getLarge(this.peaks2, index, this.LOOKBACKPERIODS, i);
            if (peak >= minPeak) {
              peaksSum += peak;
            } else {
              peaksSum += minPeak;
              minPeak = peak;
            }

            var through = FUSION.lib.getSmall(this.throughs2, index, this.LOOKBACKPERIODS, i);
            if (through <= maxThrough) {
              throughsSum += through;
            } else {
              throughsSum += maxThrough;
              maxThrough = through;
            }
          }

          this.peaksAverage.setValue(index, peaksSum / this.PEAKSANDTHROUGHS);
          this.throughsAverage.setValue(index, throughsSum / this.PEAKSANDTHROUGHS);

          if (index >= this.LOOKBACKPERIODS) {
            var ma = FUSION.lib.getMA(this.CLOSE, index, 6);
            if (
              ma === null ||
              this.peaksAverage.getValue(index) === null ||
              this.throughsAverage.getValue(index) === null
            )
              return;
            this.High.setValue(
              index + this.SHIFT,
              ((7 / 6) * this.peaksAverage.getValue(index) * this.PERCENT) / 100 + ma
            );
            this.Low.setValue(
              index + this.SHIFT,
              ((7 / 6) * this.throughsAverage.getValue(index) * this.PERCENT) / 100 + ma
            );
          }
        };
      };

      return new c(context, inputs, outputs);
    },
  };
}
