import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCHOPPINESSINDEXIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "choppinessIndexTitle",
    description: "choppinessIndexDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
      UPPERBANDVALUE: {
        type: "double",
        name: "upperBand",
        properties: { def: 61.8, max: 100, min: 0 },
        value: 61.8,
      },
      LOWERBANDVALUE: {
        type: "double",
        name: "lowerBand",
        properties: { def: 38.2, max: 100, min: 0 },
        value: 38.2,
      },
    },

    outputs: {
      CHOPPINESSINDEX: {
        type: "series",
        series: {
          seriesId: null,
          title: "choppinessIndexTitle",
          labels: ["choppinessIndexTitle", "upperBand", "lowerBand"],
          fields: ["CHOPPINESSINDEX", "UPPERBAND", "LOWERBAND"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CHOPPINESSINDEX",
        renderAs: "Line",
        dataField: "CHOPPINESSINDEX",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "CHOPPINESSINDEX",
        renderAs: "Line",
        dataField: "UPPERBAND",
        color: "#607d8b",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "CHOPPINESSINDEX",
        renderAs: "Line",
        dataField: "LOWERBAND",
        color: "#607d8b",
        width: 1,
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
          this.helper = this.context.createSeries(["TRUERANGE, ATR", "ATRSUM"]);
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.ATRSUM = this.context.getRawSeriesWrapper(this.helper, "ATRSUM");
        };

        this.calculate = function (this: any, index: any) {
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );
          this.ATR.setValue(index, FUSION.lib.getMMA(this.TRUERANGE, index, 1, this.ATR));
          this.UPPERBAND.setValue(index, this.UPPERBANDVALUE);
          this.LOWERBAND.setValue(index, this.LOWERBANDVALUE);

          var highest = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
          var lowest = FUSION.lib.getMin(this.LOW, index, this.PERIODS);
          var atrSum = FUSION.lib.getSum(this.ATR, index, this.PERIODS, this.ATRSUM);

          this.ATRSUM.setValue(index, atrSum);

          if (index < this.PERIODS) return;
          var choppinessIndex =
            (100 * Math.log10(atrSum / (highest - lowest))) / Math.log10(this.PERIODS);

          this.CHOPPINESSINDEX.setValue(index, choppinessIndex);
        };
      };
      return new Controller(context, inputs, outputs);
    },
  };
}
