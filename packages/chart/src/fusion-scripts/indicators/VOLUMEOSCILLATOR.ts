import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createVOLUMEOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "volumeOscillatorTitle",
    description: "volumeOscillatorDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
      SHORTPERIOD: {
        type: "integer",
        name: "shortPeriod",
        properties: { def: 7, max: 100, min: 1 },
        value: 7,
      },
      LONGPERIOD: {
        type: "integer",
        name: "longPeriod",
        properties: { def: 14, max: 100, min: 1 },
        value: 14,
      },
    },
    outputs: {
      VOLUMEOSCILLATOR: {
        type: "series",
        series: {
          seriesId: null,
          title: "volumeOscillatorTitle",
          labels: ["value"],
          fields: ["VolumeOscillator"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "VOLUMEOSCILLATOR",
        renderAs: "Line",
        dataField: "VolumeOscillator",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var shortMA = FUSION.lib.getMA(this.VOLUME, index, this.SHORTPERIOD);
          var longMA = FUSION.lib.getMA(this.VOLUME, index, this.LONGPERIOD);

          if (longMA === null || shortMA === null || shortMA === 0) return;

          this.VolumeOscillator.setValue(index, ((shortMA - longMA) / shortMA) * 100);
        };
    }),
  });
}
