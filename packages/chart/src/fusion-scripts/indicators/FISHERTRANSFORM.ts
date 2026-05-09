import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createFISHERTRANSFORMIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "fisherTransformTitle",
    description: "fisherTransformDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 13 },
    },

    outputs: {
      FISHERTRANSFORM: {
        type: "series",
        series: {
          seriesId: null,
          title: "fisherTransformTitle",
          labels: ["value", "trigger"],
          fields: ["FISHERTRANSFORM", "FISHERTRANSFORMTRIGGER"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FISHERTRANSFORM",
        renderAs: "Line",
        dataField: "FISHERTRANSFORM",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FISHERTRANSFORM",
        renderAs: "Line",
        dataField: "FISHERTRANSFORMTRIGGER",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["X", "PRICE"]);

          this.X = this.context.getRawSeriesWrapper(this.helper, "X");
          this.PRICE = this.context.getRawSeriesWrapper(this.helper, "PRICE");
        };

        this.calculate = function (this: any, index: any) {
          var price = (this.HIGH.getValue(index) + this.LOW.getValue(index)) / 2;
          this.PRICE.setValue(index, price);

          if (index < this.PERIODS) return;

          var round = (val: any) => (val > 0.99 ? 0.999 : val < -0.99 ? -0.999 : val);

          var max = FUSION.lib.getMax(this.PRICE, index, this.PERIODS);
          var min = FUSION.lib.getMin(this.PRICE, index, this.PERIODS);

          var x = round(
            0.66 * ((price - min) / Math.max(max - min, 0.001) - 0.5) +
              0.67 * this.X.getValue(index - 1)
          );
          this.X.setValue(index, x);

          var fisherTransform =
            0.5 * Math.log((1 + x) / Math.max(1 - x, 0.001)) +
            0.5 * this.FISHERTRANSFORM.getValue(index - 1);

          this.FISHERTRANSFORM.setValue(index, fisherTransform);
          this.FISHERTRANSFORMTRIGGER.setValue(index, this.FISHERTRANSFORM.getValue(index - 1));
        };
    }),
  });
}
