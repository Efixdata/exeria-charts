import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createVORTEXINDICATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "vortexIndicatorTitle",
    description: "vortexIndicatorDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceLow", properties: { def: "c" }, value: null },
      PERIODS: {
        type: "integer",
        name: "periods",
        properties: { def: 14, max: 100, min: 1 },
        value: 14,
      },
    },

    outputs: {
      VORETEXINDICATOR: {
        type: "series",
        series: {
          seriesId: null,
          title: "vortexIndicatorTitle",
          labels: ["vortexIndicatorPlus", "vortexIndicatorMinus"],
          fields: ["VIP", "VIM"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "VORETEXINDICATOR",
        renderAs: "Line",
        dataField: "VIP",
        color: "#03a9f4",
        width: 1,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "VORETEXINDICATOR",
        renderAs: "Line",
        dataField: "VIM",
        color: "#e91e63",
        width: 1,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "HL1",
            "LH1",
            "HL1SUM",
            "LH1SUM",
            "ATR",
            "ATRSUM",
            "TRUERANGE",
          ]);
          this.HL1 = this.context.getRawSeriesWrapper(this.helper, "HL1");
          this.LH1 = this.context.getRawSeriesWrapper(this.helper, "LH1");
          this.HL1SUM = this.context.getRawSeriesWrapper(this.helper, "HL1SUM");
          this.LH1SUM = this.context.getRawSeriesWrapper(this.helper, "LH1SUM");
          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.ATRSUM = this.context.getRawSeriesWrapper(this.helper, "ATRSUM");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
        };

        this.calculate = function (this: any, index: any) {
          var high = this.HIGH.getValue(index);
          var lastLow = this.LOW.getValue(index - 1);
          var low = this.LOW.getValue(index);
          var lastHigh = this.HIGH.getValue(index - 1);

          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );
          this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, 1, this.ATR));

          // if (high === null || low === null || lastLow === null || lastHigh === null) return;

          var hl1 = Math.abs(high - lastLow);
          this.HL1.setValue(index, hl1);

          var hl1sum = FUSION.lib.getSum(this.HL1, index, this.PERIODS, this.HL1SUM);
          this.HL1SUM.setValue(index, hl1sum);

          var lh1 = Math.abs(low - lastHigh);
          this.LH1.setValue(index, lh1);

          var lh1sum = FUSION.lib.getSum(this.LH1, index, this.PERIODS, this.LH1SUM);
          this.LH1SUM.setValue(index, lh1sum);

          var atrSum = FUSION.lib.getSum(this.ATR, index, this.PERIODS, this.ATRSUM);
          this.ATRSUM.setValue(index, atrSum);

          if (
            atrSum === null ||
            atrSum === 0 ||
            hl1sum === null ||
            lh1sum === null ||
            index < this.PERIODS
          )
            return;

          this.VIP.setValue(index, hl1sum / atrSum);
          this.VIM.setValue(index, lh1sum / atrSum);
        };
    }),
  });
}
