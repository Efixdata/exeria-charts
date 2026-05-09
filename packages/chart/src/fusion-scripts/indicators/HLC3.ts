import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createHLC3IndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "hlc3Title",
    description: "hlc3Description",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
    },

    outputs: {
      HLC3: {
        type: "series",
        series: {
          seriesId: null,
          title: "hlc3Title",
          labels: ["value"],
          fields: ["HLC3"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "HLC3",
        renderAs: "Line",
        dataField: "HLC3",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          this.HLC3.setValue(
            index,
            (this.HIGH.getValue(index) + this.LOW.getValue(index) + this.CLOSE.getValue(index)) / 3
          );
        };
    }),
  });
}
