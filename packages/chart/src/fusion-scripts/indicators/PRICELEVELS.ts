import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createPRICELEVELSIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "priceLevelsTitle",
    description: "priceLevelsDescription",
    type: "indicators",
    newPane: false,

    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      DISTANCE: {
        type: "double",
        name: "distance",
        properties: { def: 10.0, max: 999.0, min: 0.0 },
        value: 10.0,
      },
      UNITS: {
        type: "list",
        name: "type",
        properties: {},
        list: ["percent", "value"],
        value: "percent",
      },
    },

    outputs: {
      PRICELEVELS: {
        type: "series",
        series: {
          seriesId: null,
          title: "priceLevelsTitle",
          labels: ["value"],
          fields: ["PriceLevels"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "PRICELEVELS",
        renderAs: "Line",
        dataField: "PriceLevels",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.percentDistance = this.DISTANCE * 0.01;
        };

        this.onModify = function (this: any) {
          this.init();
        };

        this.calculate = function (this: any, index: any) {
          var lastPriceLevels = this.PriceLevels.getValue(index - 1);
          var close = this.CLOSE.getValue(index);

          if (close === null) return;
          if (lastPriceLevels === null) lastPriceLevels = close;

          var priceLevels = lastPriceLevels;
          var distance = this.DISTANCE;

          if (this.UNITS === "percent") {
            distance = lastPriceLevels * this.percentDistance;
          }

          if (Math.abs(lastPriceLevels - close) > distance) {
            priceLevels = close;
          }

          this.PriceLevels.setValue(index, priceLevels);
        };
    }),
  });
}
