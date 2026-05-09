import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesLinePlotter,
  createSeriesOutput,
  defineScript,
} from "../helpers/scriptDefinition";
import { updateAtrSeries } from "../helpers/indicatorMath";

export default function createKELTNERCHANNELIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
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
      KELTNERCHANNEL: createSeriesOutput(
        "keltnerChannelIndicatorTitle",
        ["upper", "lower", "middle"],
        ["Upper", "Lower", "Middle"]
      ),
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
      createSeriesLinePlotter({
        dataLink: "KELTNERCHANNEL",
        dataField: "Middle",
        color: "#425166",
        width: 1,
        dash: [0, 0],
        priceTag: false,
        priceLine: false,
      }),
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["TRUERANGE", "ATR", "EMA"]);
        this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
        this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
        this.EMA = this.context.getRawSeriesWrapper(this.helper, "EMA");
      };

      this.calculate = function (this: any, index: any) {
        var ema = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA);
        var atr = updateAtrSeries({
          FUSION,
          high: this.HIGH,
          low: this.LOW,
          close: this.CLOSE,
          index,
          period: this.ATRPERIODS,
          trueRangeSeries: this.TRUERANGE,
          atrSeries: this.ATR,
        }).atr;

        this.EMA.setValue(index, ema);

        if (index < this.PERIODS || index < this.ATRPERIODS) return;

        this.Upper.setValue(index, ema + 2 * atr);
        this.Lower.setValue(index, ema - 2 * atr);
        this.Middle.setValue(index, ema);
      };
    }),
  });
}
