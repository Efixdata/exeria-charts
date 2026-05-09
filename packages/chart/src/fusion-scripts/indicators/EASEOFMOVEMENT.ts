import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createEASEOFMOVEMENTIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "easeOfMovementTitle",
    description: "easeOfMovementDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 14 },
      DIVISOR: {
        type: "integer",
        name: "divisor",
        properties: { max: 99999999, min: 1 },
        value: 10000,
      },
    },

    outputs: {
      EASEOFMOVEMENT: {
        type: "series",
        series: {
          seriesId: null,
          title: "easeOfMovementTitle",
          labels: ["value"],
          fields: ["EASEOFMOVEMENT"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "EASEOFMOVEMENT",
        renderAs: "Line",
        dataField: "EASEOFMOVEMENT",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["EOM"]);

          this.EOM = this.context.getRawSeriesWrapper(this.helper, "EOM");
        };

        this.calculate = function (this: any, index: any) {
          var high = this.HIGH.getValue(index);
          var low = this.LOW.getValue(index);
          var volume = this.VOLUME.getValue(index);

          var lastHigh = this.HIGH.getValue(index - 1);
          var lastLow = this.LOW.getValue(index - 1);

          if (high == low || this.DIVISOR == 0) {
            this.EOM.setValue(index, this.EOM.getValue(index - 1));
          } else {
            var distanceMoved = (high + low) / 2 - (lastHigh + lastLow) / 2;
            var boxRatio = volume / this.DIVISOR / (high - low);
            var eom = distanceMoved / boxRatio;

            this.EOM.setValue(index, eom);
          }

          if (index < this.PERIODS) return;

          this.EASEOFMOVEMENT.setValue(index, FUSION.lib.getMA(this.EOM, index, this.PERIODS));
        };
    }),
  });
}
