import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCHANDEKROLLSTOPIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "chandeKrollStopTitle",
    description: "chandeKrollStopDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      P: { type: "integer", name: "chandeKrollStopP", properties: { max: 100, min: 0 }, value: 10 },
      Q: { type: "integer", name: "chandeKrollStopQ", properties: { max: 100, min: 0 }, value: 9 },
      X: { type: "integer", name: "chandeKrollStopX", properties: { max: 100, min: 0 }, value: 1 },
    },

    outputs: {
      CHANDEKROLLSTOP: {
        type: "series",
        series: {
          seriesId: null,
          title: "chandeKrollStopTitle",
          labels: ["chandeKrollStopUp", "chandeKrollStopDown"],
          fields: ["CHANDEKROLLSTOP_UP", "CHANDEKROLLSTOP_DOWN"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CHANDEKROLLSTOP",
        renderAs: "Line",
        dataField: "CHANDEKROLLSTOP_UP",
        color: "#f44336",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "CHANDEKROLLSTOP",
        renderAs: "Line",
        dataField: "CHANDEKROLLSTOP_DOWN",
        color: "#4caf50",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["TRUERANGE, ATR, FIRSTHIGHSTOP, FIRSTLOWSTOP"]);
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.FIRSTHIGHSTOP = this.context.getRawSeriesWrapper(this.helper, "FIRSTHIGHSTOP");
          this.FIRSTLOWSTOP = this.context.getRawSeriesWrapper(this.helper, "FIRSTLOWSTOP");
        };

        this.calculate = function (this: any, index: any) {
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );

          var atr = FUSION.lib.getMMA(this.TRUERANGE, index, this.P, this.ATR);
          this.ATR.setValue(index, atr);
          var highest = FUSION.lib.getMax(this.HIGH, index, this.P);
          var lowest = FUSION.lib.getMin(this.LOW, index, this.P);

          if (atr == null || highest == null || lowest == null) return;

          var firstHighStop = highest - this.X * atr;
          var firstLowStop = lowest + this.X * atr;

          this.FIRSTHIGHSTOP.setValue(index, firstHighStop);
          this.FIRSTLOWSTOP.setValue(index, firstLowStop);

          var stopShort = FUSION.lib.getMax(this.FIRSTHIGHSTOP, index, this.Q);
          var stopLong = FUSION.lib.getMin(this.FIRSTLOWSTOP, index, this.Q);

          if (stopShort == null || stopLong == null) return;

          this.CHANDEKROLLSTOP_UP.setValue(index, stopShort);
          this.CHANDEKROLLSTOP_DOWN.setValue(index, stopLong);
        };
    }),
  });
}
