import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDONCHIANCHANNELIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "donchianChannelTitle",
    description: "donchianChannelDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 20 },
    },

    outputs: {
      DONCHIANCHANNEL: {
        type: "series",
        series: {
          seriesId: null,
          title: "donchianChannelTitle",
          labels: ["upper", "lower", "middle"],
          fields: ["Upper", "Lower", "Middle"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DONCHIANCHANNEL",
        renderAs: "Band",
        upperField: "Upper",
        lowerField: "Lower",
        color: "#3f51b5",
        width: 1,
        dash: [0, 0],
      },
      {
        type: "SeriesObject",
        dataLink: "DONCHIANCHANNEL",
        renderAs: "Line",
        dataField: "Middle",
        color: "#e91e63",
        width: 1.5,
        dash: [0, 0],
        priceTag: false,
        priceLine: false,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var high = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
          var low = FUSION.lib.getMin(this.LOW, index, this.PERIODS);
          if (high === null || low === null || index < this.PERIODS) return;

          this.Upper.setValue(index, high);
          this.Lower.setValue(index, low);
          this.Middle.setValue(index, (high + low) / 2);
        };
    }),
  });
}
