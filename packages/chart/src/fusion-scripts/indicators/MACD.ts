import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesLinePlotter,
  createSeriesOutput,
  defineScript,
} from "../helpers/scriptDefinition";
import { updateMacdSeries } from "../helpers/indicatorMath";

export default function createMACDIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "macdTitle",
    description: "macdDescription",
    type: "indicators",
    newPane: true,
    centerZero: true,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      FPERIOD: {
        type: "integer",
        name: "firstPeriod",
        properties: { def: 12, max: 100, min: 0 },
        value: 12,
      },
      SPERIOD: {
        type: "integer",
        name: "secondPeriod",
        properties: { def: 26, max: 100, min: 0 },
        value: 26,
      },
      SGPERIOD: {
        type: "integer",
        name: "signalPeriod",
        properties: { def: 9, max: 100, min: 0 },
        value: 9,
      },
    },

    outputs: {
      MACD: createSeriesOutput(
        "macdTitle",
        ["line", "signal", "histogram"],
        ["MACDLine", "MACDSignal", "MACDHistogram"]
      ),
    },

    plotters: [
      createSeriesLinePlotter({
        dataLink: "MACD",
        dataField: "MACDHistogram",
        color: "#ff9800",
        width: 1,
        renderAs: "Line and Histogram",
        priceTag: false,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "MACD",
        dataField: "MACDSignal",
        color: "#f44336",
        width: 1,
        priceTag: false,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "MACD",
        dataField: "MACDLine",
        color: "#00bcd4",
        width: 1.5,
        priceTag: true,
        priceLine: true,
      }),
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["EMAF", "EMAS", "EMAG"]);
        this.EMAF = this.context.getRawSeriesWrapper(this.helper, "EMAF");
        this.EMAS = this.context.getRawSeriesWrapper(this.helper, "EMAS");
        this.EMAG = this.context.getRawSeriesWrapper(this.helper, "EMAG");
      };

      this.calculate = function (this: any, index: any) {
        updateMacdSeries({
          FUSION,
          source: this.CLOSE,
          index,
          fastPeriod: this.FPERIOD,
          slowPeriod: this.SPERIOD,
          signalPeriod: this.SGPERIOD,
          fastSeries: this.EMAF,
          slowSeries: this.EMAS,
          signalAverageSeries: this.EMAG,
          lineSeries: this.MACDLine,
          signalSeries: this.MACDSignal,
          histogramSeries: this.MACDHistogram,
          smoothing: "EMA",
        });
      };
    }),
  });
}
