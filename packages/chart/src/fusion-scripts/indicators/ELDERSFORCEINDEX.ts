import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createELDERSFORCEINDEXIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "eldersForceIndexTitle",
    description: "eldersForceIndexDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 13 },
    },

    outputs: {
      ELDERSFORCEINDEX: {
        type: "series",
        series: {
          seriesId: null,
          title: "eldersForceIndexTitle",
          labels: ["value"],
          fields: ["ELDERSFORCEINDEX"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ELDERSFORCEINDEX",
        renderAs: "Line",
        dataField: "ELDERSFORCEINDEX",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["EFI"]);

          this.EFI = this.context.getRawSeriesWrapper(this.helper, "EFI");
        };

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);
          var volume = this.VOLUME.getValue(index);

          this.EFI.setValue(index, (close - lastClose) * volume);

          if (index < this.PERIODS) return;

          this.ELDERSFORCEINDEX.setValue(
            index,
            FUSION.lib.getEMA(this.EFI, index, this.PERIODS, this.ELDERSFORCEINDEX)
          );
        };
    }),
  });
}
