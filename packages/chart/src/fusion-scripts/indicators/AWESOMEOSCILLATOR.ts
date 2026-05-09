import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createAWESOMEOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "awesomeOscillatorTitle",
    description: "awesomeOscillatorDescription",
    type: "indicators",
    newPane: true,

    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
    },

    outputs: {
      AWESOMEOSCILLATOR: {
        type: "series",
        series: {
          seriesId: null,
          title: "awesomeOscillatorTitle",
          labels: ["value"],
          fields: ["AWESOMEOSCILLATOR"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "AWESOMEOSCILLATOR",
        renderAs: "Histogram",
        dataField: "AWESOMEOSCILLATOR",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.minPeriod = 5;
          this.maxPeriod = 34;
          this.helper = this.context.createSeries(["MEDIAN"]);
          this.MEDIAN = this.context.getRawSeriesWrapper(this.helper, "MEDIAN");
        };

        this.calculate = function (this: any, index: any) {
          if (this.HIGH.getValue(index) === null || this.LOW.getValue(index) == null) return;

          this.MEDIAN.setValue(index, (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2);

          if (index < this.maxPeriod - 1) return;

          var minSMA = FUSION.lib.getMA(this.MEDIAN, index, this.minPeriod);
          var maxSMA = FUSION.lib.getMA(this.MEDIAN, index, this.maxPeriod);

          this.AWESOMEOSCILLATOR.setValue(index, minSMA - maxSMA);
        };
    }),
  });
}
