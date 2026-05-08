import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createADXIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "adxTitle",
    description: "adxDescription",
    type: "indicators",
    newPane: true,
    centerZero: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 14 },
    },

    outputs: {
      ADX: {
        type: "series",
        series: {
          seriesId: null,
          title: "adxTitle",
          labels: ["adxTitle"],
          fields: ["ADX"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ADX",
        renderAs: "Line",
        dataField: "ADX",
        color: "#FFEB3B",
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
      var ADXController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.getWilders = function (this: any, series: any, idx: any, prd: any, prev: any) {
          if (idx < prd) {
            return null;
          }
          if (prev.getValue(idx - 1) === null) {
            var movAvg = 0;
            for (var j = idx - prd + 1; j < idx + 1; j++) {
              if (series.getValue(j) === null) return null;
              movAvg = movAvg + series.getValue(j);
            }
            movAvg = movAvg / prd;
            return movAvg;
          } else {
            var wsma1 = prev.getValue(idx - 1);
            if (wsma1 === null) return null;
            var movAvg = 0;
            for (var j = idx - prd + 1; j < idx + 1; j++) {
              if (series.getValue(j) === null) return null;
              movAvg = movAvg + series.getValue(j);
            }
            if (series.getValue(idx) === null) return null;
            var wsma = (movAvg - wsma1 + series.getValue(idx)) / prd;
            return wsma;
          }
        };

        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "MDM",
            "PDM",
            "MMAUM",
            "MMADM",
            "MMAUP",
            "MMADP",
            "TRUERANGE",
            "MINUSDI",
            "PLUSDI",
            "DS",
            "aadx",
          ]);
          this.MDM = this.context.getRawSeriesWrapper(this.helper, "MDM");
          this.PDM = this.context.getRawSeriesWrapper(this.helper, "PDM");
          this.MMAUM = this.context.getRawSeriesWrapper(this.helper, "MMAUM");
          this.MMADM = this.context.getRawSeriesWrapper(this.helper, "MMADM");
          this.MMAUP = this.context.getRawSeriesWrapper(this.helper, "MMAUP");
          this.MMADP = this.context.getRawSeriesWrapper(this.helper, "MMADP");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
          this.MINUSDI = this.context.getRawSeriesWrapper(this.helper, "MINUSDI");
          this.PLUSDI = this.context.getRawSeriesWrapper(this.helper, "PLUSDI");
          this.DS = this.context.getRawSeriesWrapper(this.helper, "DS");
          this.aadx = this.context.getRawSeriesWrapper(this.helper, "aadx");
        };

        this.calculate = function (this: any, INDEX: any) {
          var low = this.LOW.getValue(INDEX);
          var low1 = this.LOW.getValue(INDEX - 1);
          var high = this.HIGH.getValue(INDEX);
          var high1 = this.HIGH.getValue(INDEX - 1);

          if (low === null || low1 === null || high === null || high1 === null) return;

          var tmpL = low1 - low;
          var tmpH = high - high1;

          if (tmpL < 0) tmpL = 0;
          if (tmpH < 0) tmpH = 0;

          this.MDM.setValue(INDEX, tmpL);
          this.PDM.setValue(INDEX, tmpH);
          this.TRUERANGE.setValue(
            INDEX,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, INDEX)
          );

          var mmaum = FUSION.lib.getMMA(this.MDM, INDEX, this.PERIOD, this.MMAUM);
          var mmadm = FUSION.lib.getMMA(this.TRUERANGE, INDEX, this.PERIOD, this.MMADM);
          var mmadp = FUSION.lib.getMMA(this.TRUERANGE, INDEX, this.PERIOD, this.MMADP);
          var mmaup = FUSION.lib.getMMA(this.PDM, INDEX, this.PERIOD, this.MMAUP);

          this.MMAUM.setValue(INDEX, mmaum);
          this.MMADM.setValue(INDEX, mmadm);
          this.MMAUP.setValue(INDEX, mmaup);
          this.MMADP.setValue(INDEX, mmadp);

          if (mmaum === null || !mmadm || !mmadp || mmaup === null) return;

          var plusdi = (100 * mmaup) / mmadp;
          var minusdi = (100 * mmaum) / mmadm;

          this.PLUSDI.setValue(INDEX, plusdi);
          this.MINUSDI.setValue(INDEX, minusdi);

          var diff = Math.abs(plusdi - minusdi);
          var summ = plusdi + minusdi;

          if (summ) {
            this.DS.setValue(INDEX, diff / summ);
            //EMA VERSION
            var aadx = this.getWilders(this.DS, INDEX, this.PERIOD, this.aadx);
            this.aadx.setValue(INDEX, aadx);

            if (aadx === null) return;
            this.ADX.setValue(INDEX, 100 * aadx);
          } else {
            this.ADX.setValue(INDEX, this.ADX.getValue(INDEX - 1));
          }
        };
      };

      return new ADXController(context, inputs, outputs);
    },
  };
}
