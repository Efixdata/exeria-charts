import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createTRENDIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "trendTitle",
    description: "trendDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      INDICATOR: { type: "series", name: "indicator", properties: {}, value: null },
    },

    outputs: {
      TREND: {
        type: "series",
        series: {
          seriesId: null,
          title: "trendTitle",
          labels: ["trendTitle"],
          fields: ["TREND"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "TREND",
        renderAs: "Line",
        dataField: "TREND",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          if (
            this.INDICATOR.getValue(index) === null ||
            this.HIGH.getValue(index) === null ||
            this.LOW.getValue(index) === null
          )
            return;
          this.TREND.setValue(index, 0);
          if (this.INDICATOR.getValue(index) >= this.HIGH.getValue(index)) {
            this.TREND.setValue(index, -1);
          } else if (this.INDICATOR.getValue(index) <= this.LOW.getValue(index)) {
            this.TREND.setValue(index, 1);
          }
        };
    }),
  });
}
