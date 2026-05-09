import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createNETVOLUMEIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "netVolumeTitle",
    description: "netVolumeDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
    },

    outputs: {
      NETVOLUME: {
        type: "series",
        series: {
          seriesId: null,
          title: "netVolumeTitle",
          labels: ["value"],
          fields: ["NETVOLUME"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "NETVOLUME",
        renderAs: "Line",
        dataField: "NETVOLUME",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["X"]);
          this.X = this.context.getRawSeriesWrapper(this.helper, "X");
        };

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);

          if (close == null || lastClose == null) return;

          if (close - lastClose > 0) {
            this.NETVOLUME.setValue(index, this.VOLUME.getValue(index));
          } else if (close == lastClose) {
            this.NETVOLUME.setValue(index, 0);
          } else {
            this.NETVOLUME.setValue(index, this.VOLUME.getValue(index) * -1);
          }
        };
    }),
  });
}
