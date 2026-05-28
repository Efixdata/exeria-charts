import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createCANDLESTICKPATTERNSStrategyScript(FUSION: CoreFusionStatic) {
  return {
    title: "candlestickPatternsTitle",
    description: "candlestickPatternsDescription",
    type: "strategies",
    newPane: false,
    inputs: {
      OPEN: { type: "series", name: "priceOpen", properties: { def: "o" }, value: null },
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      CHOSENPATTERNS: {
        type: "booleanList",
        name: "chooseCandlestickPatterns",
        properties: {},
        value: {
          DIFFUSION: { name: "DIFFUSION", value: true },
          MORNINGSTAR: { name: "MORNINGSTAR", value: true },
          SHOOTINGSTAR: { name: "SHOOTINGSTAR", value: true },
          EVENINGSTAR: { name: "EVENINGSTAR", value: true },
          BEARISHHARAMI: { name: "BEARISHHARAMI", value: true },
          BULLISHHARAMI: { name: "BULLISHHARAMI", value: true },
          HAMMER: { name: "HAMMER", value: true },
          BESSAHUG: { name: "BESSAHUG", value: true },
          HOSSAHUG: { name: "HOSSAHUG", value: true },
          REVERSEDHAMMER: { name: "REVERSEDHAMMER", value: true },
          HANGMAN: { name: "HANGMAN", value: true },
          HIGHWAVEDOWN: { name: "HIGHWAVEDOWN", value: true },
          HIGHWAVEUP: { name: "HIGHWAVEUP", value: true },
          DARKCLOUDCOVER: { name: "DARKCLOUDCOVER", value: true },
          DOJIDOWN: { name: "DOJIDOWN", value: true },
          DOJIUP: { name: "DOJIUP", value: true },
        },
      },
    },
    outputs: {
      CANDLESTICKPATTERNS: {
        type: "tooltipSeries",
        series: {
          seriesId: null,
          title: "candlestickPatternsTitle",
          labels: ["value"],
          fields: ["CANDLESTICKPATTERNS"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "CandlestickPatternStrategyObject",
        dataLink: "CANDLESTICKPATTERNS",
        renderAs: "",
        dataField: "CANDLESTICKPATTERNS",
        buyColor: "#3CC3AF",
        sellColor: "#CE3E5B",
        width: 1,
        dash: [],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var CandlestickPatternsController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.LLV = function (this: any, data: any, periods: any, index: any) {
          if (index < periods - 1) {
            return data.getValue(index);
          }

          var min = FUSION.MAX_VALUE;
          for (var i = 0; i < periods; i++) {
            if (data.getValue(index - periods + 1 + i) < min)
              min = data.getValue(index - periods + 1 + i);
          }
          return min;
        };

        this.HHV = function (this: any, data: any, periods: any, index: any) {
          if (index < periods - 1) {
            return data.getValue(index);
          }
          var max = FUSION.MIN_VALUE;
          for (var i = 0; i < periods; i++) {
            if (data.getValue(index - periods + 1 + i) > max)
              max = data.getValue(index - periods + 1 + i);
          }
          return max;
        };

        this.absOC = function (this: any, OPEN: any, CLOSE: any) {
          var helper = this.context.createSeries(["ABSOC"]);
          var absOC = this.context.getRawSeriesWrapper(helper, "ABSOC");
          var BACK = this.CLOSE.length;
          for (var i = 0; i < BACK; i++) {
            var value = Math.abs(this.OPEN.getValue(i) - this.CLOSE.getValue(i));
            absOC.setValue(i, value.toFixed(4));
          }
          return absOC;
        };

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
          var CONTEXT = this.context;
          this.helper = this.context.createSeries([
            "SMA",
            "SMAABSOC",
            "ATR",
            "TRUERANGE",
            "AU",
            "AD",
            "MAU",
            "MAD",
            "RSIBaseHI",
            "RSIBaseLO",
            "RSI",
            "tempLongs",
            "tempShorts",
            "stopLong",
            "stopShort",
            "isLong",
            "CEX",
          ]);

          this.SMA = this.context.getRawSeriesWrapper(this.helper, "SMA");
          this.SMAABSOC = this.context.getRawSeriesWrapper(this.helper, "SMAABSOC");
          this.ABSOC = this.absOC(this.OPEN, this.CLOSE);

          this.ATR = this.context.getRawSeriesWrapper(this.helper, "ATR");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");

          this.AU = this.context.getRawSeriesWrapper(this.helper, "AU");
          this.AD = this.context.getRawSeriesWrapper(this.helper, "AD");
          this.MAU = this.context.getRawSeriesWrapper(this.helper, "MAU");
          this.MAD = this.context.getRawSeriesWrapper(this.helper, "MAD");
          this.RSIBaseHI = this.context.getRawSeriesWrapper(this.helper, "RSIBaseHI");
          this.RSIBaseLO = this.context.getRawSeriesWrapper(this.helper, "RSIBaseLO");
          this.RSI = this.context.getRawSeriesWrapper(this.helper, "RSI");
          this.PERIOD = 14;
          this.LO_BASELINE = 30;
          this.HI_BASELINE = 70;

          this.tempLongs = this.context.getRawSeriesWrapper(this.helper, "tempLongs");
          this.tempShorts = this.context.getRawSeriesWrapper(this.helper, "tempShorts");
          this.stopLong = this.context.getRawSeriesWrapper(this.helper, "stopLong");
          this.stopShort = this.context.getRawSeriesWrapper(this.helper, "stopShort");
          this.isLong = this.context.getRawSeriesWrapper(this.helper, "isLong");
          this.CEX = this.context.getRawSeriesWrapper(this.helper, "CEX");
          this.PERIODS = 10;
          this.RATE = 5;
        };

        this.calculate = function (this: any, INDEX: any) {
          var CONTEXT = this.context;
          var OPEN = this.OPEN;
          var HIGH = this.HIGH;
          var LOW = this.LOW;
          var CLOSE = this.CLOSE;
          var PERIODS = this.PERIODS;
          var PERIOD = this.PERIOD;
          var RATE = this.RATE;
          this.PCH = this.HHV(HIGH, 20, INDEX);
          this.PCL = this.LLV(LOW, 20, INDEX);
          this.PCM = (this.PCH + this.PCL) / 2;

          this.SMA.setValue(INDEX, FUSION.lib.getMA(CLOSE, INDEX, 10));
          this.SMAABSOC.setValue(INDEX, FUSION.lib.getMA(this.ABSOC, INDEX, 10));

          this.TRUERANGE.setValue(INDEX, FUSION.lib.getTrueRange(HIGH, LOW, CLOSE, INDEX));
          this.ATR.setValue(INDEX, FUSION.lib.getMMA(this.TRUERANGE, INDEX, 10, this.ATR));

          this.AU.setValue(INDEX, 0);
          this.AD.setValue(INDEX, 0);
          this.MAU.setValue(INDEX, 0);
          this.MAD.setValue(INDEX, 0);
          this.RSIBaseHI.setValue(INDEX, this.HI_BASELINE);
          this.RSIBaseLO.setValue(INDEX, this.LO_BASELINE);
          this.RSI.setValue(INDEX, this.LO_BASELINE + (this.HI_BASELINE - this.LO_BASELINE) / 2);

          if (INDEX > PERIOD - 1) {
            var diff = CLOSE.getValue(INDEX) - CLOSE.getValue(INDEX - 1);

            if (diff > 0) {
              this.AU.setValue(INDEX, diff);
              this.AD.setValue(INDEX, 0);
            } else {
              this.AU.setValue(INDEX, 0);
              this.AD.setValue(INDEX, -diff);
            }

            var mmaAU = FUSION.lib.getMMA(this.AU, INDEX, PERIOD, this.MAU);
            var mmaAD = FUSION.lib.getMMA(this.AD, INDEX, PERIOD, this.MAD);
            this.MAU.setValue(INDEX, mmaAU);
            this.MAD.setValue(INDEX, mmaAD);
            if (mmaAU + mmaAD == 0)
              this.RSI.setValue(
                INDEX,
                this.LO_BASELINE + (this.HI_BASELINE - this.LO_BASELINE) / 2
              );
            else this.RSI.setValue(INDEX, (100 * mmaAU) / (mmaAU + mmaAD));
          }

          this.CEX.setValue(INDEX, CLOSE.getValue(INDEX));

          var stateLong = FUSION.MIN_VALUE;
          var stateShort = FUSION.MAX_VALUE;

          if (INDEX < PERIODS) {
            this.tempLongs.setValue(INDEX, stateLong);
            this.tempShorts.setValue(INDEX, stateShort);
            this.isLong.setValue(INDEX, -1);
            this.stopLong.setValue(INDEX, FUSION.MAX_VALUE);
            this.stopShort.setValue(INDEX, FUSION.MIN_VALUE);
          } else {
            this.tempLongs.setValue(INDEX, CLOSE.getValue(INDEX) - RATE * this.ATR.getValue(INDEX));
            this.tempShorts.setValue(
              INDEX,
              CLOSE.getValue(INDEX) + RATE * this.ATR.getValue(INDEX)
            );

            stateLong = FUSION.lib.getMax(this.tempLongs, INDEX, PERIODS);
            stateShort = FUSION.lib.getMin(this.tempShorts, INDEX, PERIODS);

            this.stopLong.setValue(
              INDEX,
              CLOSE.getValue(INDEX) < this.stopLong.getValue(INDEX - 1)
                ? stateLong
                : stateLong >= this.stopLong.getValue(INDEX - 1)
                  ? stateLong
                  : this.stopLong.getValue(INDEX - 1)
            );
            this.stopShort.setValue(
              INDEX,
              CLOSE.getValue(INDEX) > this.stopShort.getValue(INDEX - 1)
                ? stateShort
                : stateShort <= this.stopShort.getValue(INDEX - 1)
                  ? stateShort
                  : this.stopShort.getValue(INDEX - 1)
            );

            var blong = false;
            if (this.isLong.getValue(INDEX - 1) == 1) blong = true;

            if (
              (this.isInRange(
                OPEN.getValue(INDEX),
                CLOSE.getValue(INDEX),
                this.CEX.getValue(INDEX - 1)
              ) ||
                this.CEX.getValue(INDEX - 1) > CLOSE.getValue(INDEX)) &&
              blong
            ) {
              this.isLong.setValue(INDEX, -1);
            } else if (
              (this.isInRange(
                OPEN.getValue(INDEX),
                CLOSE.getValue(INDEX),
                this.CEX.getValue(INDEX - 1)
              ) ||
                this.CEX.getValue(INDEX - 1) < CLOSE.getValue(INDEX)) &&
              !blong
            ) {
              this.isLong.setValue(INDEX, 1);
            } else {
              this.isLong.setValue(INDEX, this.isLong.getValue(INDEX - 1));
            }

            if (this.isLong.getValue(INDEX) == 1)
              this.CEX.setValue(INDEX, this.stopLong.getValue(INDEX));
            else this.CEX.setValue(INDEX, this.stopShort.getValue(INDEX));
          }

          this.ATR10 = this.ATR.getValue(INDEX);
          this.ATR10_1 = this.ATR.getValue(INDEX - 1);
          this.RSI14 = this.RSI.getValue(INDEX);
          this.CEX10_5 = this.CEX.getValue(INDEX);
          this.SMA10ABSOC = this.SMAABSOC.getValue(INDEX);

          var O = OPEN.getValue(INDEX);
          var H = HIGH.getValue(INDEX);
          var L = LOW.getValue(INDEX);
          var C = CLOSE.getValue(INDEX);

          var O_1 = OPEN.getValue(INDEX - 1);
          var H_1 = HIGH.getValue(INDEX - 1);
          var L_1 = LOW.getValue(INDEX - 1);
          var C_1 = CLOSE.getValue(INDEX - 1);

          var O_2 = OPEN.getValue(INDEX - 2);
          var H_2 = HIGH.getValue(INDEX - 2);
          var L_2 = LOW.getValue(INDEX - 2);
          var C_2 = CLOSE.getValue(INDEX - 2);

          var value = 0;
          var signal = 0;
          var showSignal = 1;

          this.CANDLESTICKPATTERNS.clearTooltips(INDEX);

          if (
            this.CHOSENPATTERNS.DIFFUSION &&
            O_1 > C_1 &&
            O < C &&
            O < C_1 &&
            C > C_1 + 0.5 * (O_1 - C_1) &&
            C < O_1 &&
            H - C < 0.5 * (C - O) &&
            O - L < 0.5 * (C - O) &&
            H_1 - O_1 < 0.5 * (O_1 - C_1) &&
            C_1 - L_1 < 0.5 * (O_1 - C_1) &&
            this.RSI14 < 50 &&
            H_1 - L_1 > this.ATR10_1 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "DIFFUSION", FUSION.BUY);
            }
          }

          if (INDEX >= 2) {
            if (
              this.CHOSENPATTERNS.MORNINGSTAR &&
              C_2 < O_2 &&
              C > O &&
              O_2 - C_2 > this.SMA10ABSOC &&
              Math.abs(C_1 - O_1) < this.SMA10ABSOC / 2 &&
              C_1 < C_2 &&
              O_1 < C_2 &&
              C > (O_2 + C_2) / 2 &&
              this.RSI14 < 60 &&
              C < this.CEX10_5
            ) {
              if (signal < 0) {
                showSignal = 0;
              } else {
                signal = 1;
                this.CANDLESTICKPATTERNS.setTooltip(INDEX, "MORNINGSTAR", FUSION.BUY);
              }
            }
          }

          if (
            this.CHOSENPATTERNS.SHOOTINGSTAR &&
            ((C <= O && H - O >= 1.9 * (O - C) && H - O > 1.5 * (C - L)) ||
              (C >= O && H - C >= 1.9 * (C - O) && H - C > 1.5 * (O - L))) &&
            H >= this.PCH - (this.PCH - this.PCL) / 4 &&
            this.RSI14 >= 60 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "SHOOTINGSTAR", FUSION.SELL);
            }
          }

          if (INDEX >= 2) {
            if (
              this.CHOSENPATTERNS.EVENINGSTAR &&
              C_2 > O_2 &&
              C < O &&
              C_2 - O_2 > this.SMA10ABSOC &&
              Math.abs(C_1 - O_1) < this.SMA10ABSOC / 2 &&
              C_1 > C_2 &&
              O_1 > C_2 &&
              this.RSI14 > 50 &&
              C < (O_2 + C_2) / 2 &&
              C > this.CEX10_5
            ) {
              if (signal > 0) {
                showSignal = 0;
              } else {
                signal = -1;
                this.CANDLESTICKPATTERNS.setTooltip(INDEX, "EVENINGSTAR", FUSION.SELL);
              }
            }
          }

          if (
            this.CHOSENPATTERNS.BEARISHHARAMI &&
            O_1 < C_1 &&
            O >= C &&
            C > O_1 &&
            O < C_1 &&
            O - C < (2 / 3) * (C_1 - O_1) &&
            H_1 - C_1 < 0.5 * (C_1 - O_1) &&
            O_1 - L_1 < 0.5 * (C_1 - O_1) &&
            this.RSI14 > 50 &&
            H_1 - L_1 > this.ATR10_1 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "BEARISHHARAMI", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.BULLISHHARAMI &&
            O_1 > C_1 &&
            O <= C &&
            O > C_1 &&
            C < O_1 &&
            C - O < (2 / 3) * (O_1 - C_1) &&
            H_1 - O_1 < 0.5 * (O_1 - C_1) &&
            C_1 - L_1 < 0.5 * (O_1 - C_1) &&
            this.RSI14 < 50 &&
            H_1 - L_1 > this.ATR10_1 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "BULLISHHARAMI", FUSION.BUY);
            }
          }

          if (
            this.CHOSENPATTERNS.HAMMER &&
            ((C >= O && O - L >= 1.5 * (C - O) && O - L > 2 * (H - C)) ||
              (C < O && C - L >= 1.5 * (O - C) && C - L > 2 * (H - O)) == true) &&
            L <= this.PCL + (this.PCH - this.PCL) / 4 &&
            this.RSI14 <= 40 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "HAMMER", FUSION.BUY);
            }
          }

          if (
            this.CHOSENPATTERNS.BESSAHUG &&
            O_1 < C_1 &&
            C_1 - O_1 > 0.02 * O_1 &&
            O > C_1 &&
            C < O_1 &&
            H >= this.PCH - (this.PCH - this.PCL) / 4 &&
            this.RSI14 >= 60 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "BESSAHUG", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.HOSSAHUG &&
            C_1 < O_1 &&
            O_1 - C_1 > 0.02 * O_1 &&
            O < C_1 &&
            C > O_1 &&
            L <= this.PCL + (this.PCH - this.PCL) / 4 &&
            this.RSI14 <= 40 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "HOSSAHUG", FUSION.BUY);
            }
          }

          if (
            this.CHOSENPATTERNS.REVERSEDHAMMER &&
            ((O <= C &&
              H - C >= 2 * (C - O) &&
              H - C >= 3 * (O - L) &&
              this.RSI14 < 40 &&
              (C < C_1 || C < O_1)) ||
              (C < O &&
                H - O >= 2 * (O - C) &&
                H - O >= 3 * (C - L) &&
                this.RSI14 < 40 &&
                O < C_1 &&
                O < O_1)) &&
            C < this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "REVERSEDHAMMER", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.HANGMAN &&
            (C < O && C - L >= 1.5 * (O - C) && C - L > 2 * (H - O)) == true &&
            H >= this.PCH - (this.PCH - this.PCL) / 4 &&
            this.RSI14 >= 60 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "HANGMAN", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.HIGHWAVEDOWN &&
            ((O - C > 0 &&
              Math.abs(O - C) <= 0.1 * this.ATR10 &&
              H - O >= 4 * Math.abs(O - C) &&
              C - L >= 4 * Math.abs(O - C)) ||
              (C - O > 0 &&
                Math.abs(O - C) <= 0.1 * this.ATR10 &&
                H - C >= 4 * Math.abs(O - C) &&
                O - L >= 4 * Math.abs(O - C))) &&
            H >= this.PCH - (this.PCH - this.PCL) / 4 &&
            this.RSI14 >= 60 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "HIGHWAVEDOWN", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.HIGHWAVEUP &&
            ((O - C > 0 &&
              Math.abs(O - C) <= 0.1 * this.ATR10 &&
              H - O >= 4 * Math.abs(O - C) &&
              C - L >= 4 * Math.abs(O - C)) ||
              (C - O > 0 &&
                Math.abs(O - C) <= 0.1 * this.ATR10 &&
                H - C >= 4 * Math.abs(O - C) &&
                O - L >= 4 * Math.abs(O - C))) &&
            L <= this.PCL + (this.PCH - this.PCL) / 4 &&
            this.RSI14 <= 40 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "HIGHWAVEUP", FUSION.BUY);
            }
          }

          if (
            this.CHOSENPATTERNS.DARKCLOUDCOVER &&
            O_1 < C_1 &&
            O > C &&
            O > C_1 &&
            C < O_1 + 0.5 * (C_1 - O_1) &&
            C > O_1 &&
            H - O < 0.5 * (O - C) &&
            C - L < 0.5 * (O - C) &&
            H_1 - C_1 < 0.5 * (C_1 - O_1) &&
            O_1 - L_1 < 0.5 * (C_1 - O_1) &&
            this.RSI14 > 50 &&
            H_1 - L_1 > this.ATR10_1 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "DARKCLOUDCOVER", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.DOJIDOWN &&
            ((O - C > 0 &&
              Math.abs(O - C) <= 0.03 * this.ATR10 &&
              H - O >= 1 * Math.abs(O - C) &&
              C - L >= 1 * Math.abs(O - C)) ||
              (C - O > 0 &&
                Math.abs(O - C) <= 0.03 * this.ATR10 &&
                H - C >= 1 * Math.abs(O - C) &&
                O - L >= 1 * Math.abs(O - C))) &&
            H >= this.PCH - (this.PCH - this.PCL) / 4 &&
            this.RSI14 >= 60 &&
            C > this.CEX10_5
          ) {
            if (signal > 0) {
              showSignal = 0;
            } else {
              signal = -1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "DOJIDOWN", FUSION.SELL);
            }
          }

          if (
            this.CHOSENPATTERNS.DOJIUP &&
            ((O - C > 0 &&
              Math.abs(O - C) <= 0.03 * this.ATR10 &&
              H - O >= 1 * Math.abs(O - C) &&
              C - L >= 1 * Math.abs(O - C)) ||
              (C - O > 0 &&
                Math.abs(O - C) <= 0.03 * this.ATR10 &&
                H - C >= 1 * Math.abs(O - C) &&
                O - L >= 1 * Math.abs(O - C))) &&
            L <= this.PCL + (this.PCH - this.PCL) / 4 &&
            this.RSI14 <= 40 &&
            C < this.CEX10_5
          ) {
            if (signal < 0) {
              showSignal = 0;
            } else {
              signal = 1;
              this.CANDLESTICKPATTERNS.setTooltip(INDEX, "DOJIUP", FUSION.BUY);
            }
          }

          //this.CANDLESTICKPATTERNS.setBinaryValue(INDEX, value);

          if (showSignal == 1) {
            this.CANDLESTICKPATTERNS.setValue(INDEX, signal);
            this.CANDLESTICKPATTERNS.setStrength(INDEX, 1);
          } else {
            this.CANDLESTICKPATTERNS.clearTooltips(INDEX);
            this.CANDLESTICKPATTERNS.setValue(INDEX, 0);
            this.CANDLESTICKPATTERNS.setStrength(INDEX, 0);
          }
        };
      };

      return new CandlestickPatternsController(context, inputs, outputs);
    },
  };
}
