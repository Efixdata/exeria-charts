import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesLinePlotter,
  createSeriesOutput,
  defineScript,
} from "../helpers/scriptDefinition";
import { updateMacdSeries } from "../helpers/indicatorMath";

export default function createDINAPOLIMACDIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "diNapoliMacdTitle",
    description: "diNapoliMacdDescription",
    subscriptionPack: "diNapoliTools",
    type: "indicators",
    newPane: true,
    centerZero: true,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      SMOOTHINGFACTOR1: {
        type: "double",
        name: "smoothingFactor1",
        properties: { def: 0.213, max: 1, min: 0.001, step: 0.001 },
        value: 0.213,
      },
      SMOOTHINGFACTOR2: {
        type: "double",
        name: "smoothingFactor2",
        properties: { def: 0.108, max: 1, min: 0.001, step: 0.001 },
        value: 0.108,
      },
      SIGNALLINESMOOTHINGFACTOR: {
        type: "double",
        name: "signalLineSmoothingFactor",
        properties: { def: 0.199, max: 1, min: 0.001, step: 0.001 },
        value: 0.199,
      },
    },

    outputs: {
      MACD: createSeriesOutput(
        "diNapoliMacdTitle",
        ["line", "signal", "histogram"],
        ["MACDLine", "MACDSignal"]
      ),
    },

    plotters: [
      createSeriesLinePlotter({
        dataLink: "MACD",
        dataField: "MACDSignal",
        color: "#f403ea",
        width: 1.5,
        priceTag: true,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "MACD",
        dataField: "MACDLine",
        color: "#03a9f4",
        width: 1.5,
        priceTag: true,
        priceLine: false,
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
          fastPeriod: 1 / this.SMOOTHINGFACTOR1,
          slowPeriod: 1 / this.SMOOTHINGFACTOR2,
          signalPeriod: 1 / this.SIGNALLINESMOOTHINGFACTOR,
          fastSeries: this.EMAF,
          slowSeries: this.EMAS,
          signalAverageSeries: this.EMAG,
          lineSeries: this.MACDLine,
          signalSeries: this.MACDSignal,
          smoothing: "MMA",
        });
      };
    }),
  });
}
