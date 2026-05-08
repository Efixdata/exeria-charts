import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCEXIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "cexTitle",
    description: "cexDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      OPEN: { type: "series", name: "priceOpen", properties: { def: "o" }, value: null },
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periodsATR", properties: { max: 100, min: 0 }, value: 12 },
      RATE: { type: "double", name: "rateATR", properties: { max: 200, min: 0 }, value: 4 },
    },

    outputs: {
      CEX: {
        type: "series",
        series: {
          seriesId: null,
          title: "cexDescription",
          labels: ["cexTitle"],
          fields: ["CEX"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CEX",
        renderAs: "Line",
        dataField: "CEX",
        color: "#00bcd4",
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
      var CEXController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.isInRange = function (this: any, rangeStart: any, rangeEnd: any, value: any) {
          if (rangeStart > rangeEnd) {
            var tmp = rangeStart;
            rangeStart = rangeEnd;
            rangeEnd = tmp;
          }
          if (rangeStart < value && rangeEnd > value) return true;
          else return false;
        };

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "tempLongs",
            "tempShorts",
            "stopLong",
            "stopShort",
            "isLong",
            "ATR",
            "TRUERANGE",
          ]);
          this.tempLongs = this.context.getRawSeriesWrapper(this.helper, "tempLongs");
          this.tempShorts = this.context.getRawSeriesWrapper(this.helper, "tempShorts");
          this.stopLong = this.context.getRawSeriesWrapper(this.helper, "stopLong");
          this.stopShort = this.context.getRawSeriesWrapper(this.helper, "stopShort");
          this.isLong = this.context.getRawSeriesWrapper(this.helper, "isLong");
          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
        };

        this.onModify = function (this: any) {
          this.init();
        };

        this.calculate = function (this: any, index: any) {
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );
          this.ATR.setValue(
            index,
            FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIODS, this.ATR)
          );

          var stateLong = FUSION.MIN_VALUE;
          var stateShort = FUSION.MAX_VALUE;
          var lastCex = this.CEX.getValue(index - 1);
          var close = this.CLOSE.getValue(index);
          var open = this.OPEN.getValue(index);
          var atr = this.ATR.getValue(index);

          if (atr === null || open === null) {
            this.tempLongs.setValue(index, stateLong);
            this.tempShorts.setValue(index, stateShort);
            this.isLong.setValue(index, -1);
            this.stopLong.setValue(index, FUSION.MAX_VALUE);
            this.stopShort.setValue(index, FUSION.MIN_VALUE);
          } else {
            var lastStopLong = this.stopLong.getValue(index - 1);
            var lastStopShort = this.stopShort.getValue(index - 1);

            if (open === null || close === null || atr === null) return;

            this.tempLongs.setValue(index, close - this.RATE * atr);
            this.tempShorts.setValue(index, close + this.RATE * atr);

            stateLong = FUSION.lib.getMax(this.tempLongs, index, this.PERIODS);
            stateShort = FUSION.lib.getMin(this.tempShorts, index, this.PERIODS);

            this.stopLong.setValue(
              index,
              close < lastStopLong
                ? stateLong
                : stateLong >= lastStopLong
                  ? stateLong
                  : lastStopLong
            );
            this.stopShort.setValue(
              index,
              close > lastStopShort
                ? stateShort
                : stateShort <= lastStopShort
                  ? stateShort
                  : lastStopShort
            );

            var blong = false;
            if (this.isLong.getValue(index - 1) == 1) blong = true;

            if ((this.isInRange(open, close, lastCex) || lastCex > close) && blong) {
              this.isLong.setValue(index, -1);
            } else if ((this.isInRange(open, close, lastCex) || lastCex < close) && !blong) {
              this.isLong.setValue(index, 1);
            } else {
              this.isLong.setValue(index, this.isLong.getValue(index - 1));
            }
            if (this.isLong.getValue(index) == 1)
              this.CEX.setValue(index, this.stopLong.getValue(index));
            else this.CEX.setValue(index, this.stopShort.getValue(index));
          }
        };
      };

      return new CEXController(context, inputs, outputs);
    },
  };
}
