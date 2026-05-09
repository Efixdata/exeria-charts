import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createMOMENTUMIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "momentumTitle",
    description: "momentumDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
      MODE: {
        type: "list",
        name: "method",
        properties: {},
        list: ["Quotient", "Difference"],
        value: "Quotient",
      },
    },

    outputs: {
      MOMENTUM: {
        type: "series",
        series: {
          seriesId: null,
          title: "momentumTitle",
          labels: ["momentumTitle"],
          fields: ["MOMENTUM"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MOMENTUM",
        renderAs: "Line",
        dataField: "MOMENTUM",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          if (this.CLOSE.getValue(index) === null) return;
          var displace = FUSION.lib.displace(this.CLOSE, index, this.PERIODS);
          if (displace === null) return;

          if (this.MODE === "Quotient") {
            //!DIVMODE)
            this.MOMENTUM.setValue(index, (100 * this.CLOSE.getValue(index)) / displace);
          } else {
            this.MOMENTUM.setValue(index, this.CLOSE.getValue(index) - displace);
          }
        };
    }),
  });
}
