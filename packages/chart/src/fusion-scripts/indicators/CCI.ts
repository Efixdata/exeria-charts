import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCCIIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "cciTitle",
    description: "cciDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 12 },
    },

    outputs: {
      CCI: {
        type: "series",
        series: {
          seriesId: null,
          title: "cciDescription",
          labels: ["cciTitle"],
          fields: ["CCI"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CCI",
        renderAs: "Line",
        dataField: "CCI",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["MEAN", "AVG"]);
          this.MEAN = this.context.getRawSeriesWrapper(this.helper, "MEAN");
          this.AVG = this.context.getRawSeriesWrapper(this.helper, "AVG");
        };

        this.calculate = function (this: any, index: any) {
          if (
            this.HIGH.getValue(index) === null ||
            this.LOW.getValue(index) === null ||
            this.CLOSE.getValue(index) === null
          )
            return;

          this.MEAN.setValue(
            index,
            (this.HIGH.getValue(index) + this.LOW.getValue(index) + this.CLOSE.getValue(index)) / 3
          );
          this.AVG.setValue(index, FUSION.lib.getMA(this.MEAN, index, this.PERIODS));
          if (this.AVG.getValue(index) === null) return;

          var dev = 0.0;
          if (index >= this.PERIODS - 1) {
            for (var j = index - this.PERIODS + 1; j <= index; j++) {
              if (this.MEAN.getValue(j) === null) return;
              dev = dev + Math.abs(this.MEAN.getValue(j) - this.AVG.getValue(index));
            }

            this.CCI.setValue(
              index,
              ((this.MEAN.getValue(index) - this.AVG.getValue(index)) * this.PERIODS) / dev / 0.015
            );
          }
        };
    }),
  });
}
