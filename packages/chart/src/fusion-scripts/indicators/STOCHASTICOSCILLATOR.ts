import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import {
  createController,
  createSeriesLinePlotter,
  createSeriesOutput,
  defineScript,
} from "../helpers/scriptDefinition";
import { updateStochasticOscillator } from "../helpers/indicatorMath";

export default function createSTOCHASTICOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "stochasticOscillatorTitle",
    description: "stochasticOscillatorDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 8 },
      K_SLOW_PERIOD: {
        type: "integer",
        name: "kSlowPeriod",
        properties: { def: 3, max: 100, min: 0 },
        value: 3,
      },
      D_SLOW_PERIOD: {
        type: "integer",
        name: "dSlowPeriod",
        properties: { def: 3, max: 100, min: 0 },
        value: 3,
      },
      HI_BASELINE: {
        type: "integer",
        name: "hiBaseline",
        properties: { def: 80, max: 100, min: 0 },
        value: 80,
      },
      LO_BASELINE: {
        type: "integer",
        name: "loBaseline",
        properties: { def: 20, max: 100, min: 0 },
        value: 20,
      },
    },

    outputs: {
      SO: createSeriesOutput(
        "stochasticOscillatorTitle",
        ["SOLineK", "SOLineD", "SOBaseHI", "SOBaseLO"],
        ["SOLineK", "SOLineD", "SOBaseHI", "SOBaseLO"]
      ),
    },

    plotters: [
      createSeriesLinePlotter({
        dataLink: "SO",
        dataField: "SOLineK",
        color: "#f44336",
        width: 1.5,
        priceTag: false,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "SO",
        dataField: "SOLineD",
        color: "#00bcd4",
        width: 1.5,
        priceTag: false,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "SO",
        dataField: "SOBaseHI",
        color: "#607d8b",
        width: 1,
        priceTag: false,
        priceLine: false,
      }),
      createSeriesLinePlotter({
        dataLink: "SO",
        dataField: "SOBaseLO",
        color: "#607d8b",
        width: 1,
        priceTag: false,
        priceLine: false,
      }),
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {
        this.helper = this.context.createSeries(["KSERIES"]);
        this.KSERIES = this.context.getRawSeriesWrapper(this.helper, "KSERIES");
      };

      this.calculate = function (this: any, index: any) {
        updateStochasticOscillator({
          FUSION,
          high: this.HIGH,
          low: this.LOW,
          close: this.CLOSE,
          index,
          period: this.PERIOD,
          kPeriod: this.K_SLOW_PERIOD,
          dPeriod: this.D_SLOW_PERIOD,
          kBaseSeries: this.KSERIES,
          kSeries: this.SOLineK,
          dSeries: this.SOLineD,
          highBaselineSeries: this.SOBaseHI,
          lowBaselineSeries: this.SOBaseLO,
          highBaselineValue: this.HI_BASELINE,
          lowBaselineValue: this.LO_BASELINE,
          smoothing: "MA",
        });
      };
    }),
  });
}
