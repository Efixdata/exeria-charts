import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createKELTNERCHANNELIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "keltnerChannelIndicatorTitle",
    description: "keltnerChannelIndicatorDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 20 },
      ATRPERIODS: {
        type: "integer",
        name: "ATRPeriods",
        properties: { max: 100, min: 0 },
        value: 10,
      },
    },
    outputs: {
      KELTNERCHANNEL: {
        type: "series",
        series: {
          seriesId: null,
          title: "keltnerChannelIndicatorTitle",
          labels: ["upper", "lower", "middle"],
          fields: ["Upper", "Lower", "Middle"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "KELTNERCHANNEL",
        renderAs: "Band",
        upperField: "Upper",
        lowerField: "Lower",
        color: "#5b6f8b",
        width: 1,
        dash: [0, 0],
      },
      {
        type: "SeriesObject",
        dataLink: "KELTNERCHANNEL",
        renderAs: "Line",
        dataField: "Middle",
        color: "#425166",
        width: 1,
        dash: [0, 0],
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
          this.helper = this.context.createSeries(["TRUERANGE", "ATR", "EMA"]);
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.EMA = this.context.getRawSeriesWrapper(this.helper, "EMA");
        };

        this.calculate = function (this: any, index: any) {
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );

          var ema = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA);
          var atr = FUSION.lib.getMMA(this.TRUERANGE, index, this.ATRPERIODS, this.ATR);
          this.ATR.setValue(index, atr);
          this.EMA.setValue(index, ema);

          if (index < this.PERIODS || index < this.ATRPERIODS) return;

          this.Upper.setValue(index, ema + 2 * atr);
          this.Lower.setValue(index, ema - 2 * atr);
          this.Middle.setValue(index, ema);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
