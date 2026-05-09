import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCMFIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "cmfTitle",
    description: "cmfDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      VOLUME: { type: "series", name: "priceVolume", properties: { def: "v" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 21 },
    },
    outputs: {
      CMF: {
        type: "series",
        series: {
          seriesId: null,
          title: "cmfTitle",
          labels: ["value"],
          fields: ["CMFValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CMF",
        renderAs: "Line",
        dataField: "CMFValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["ADL", "ADLSum", "VolumeSum"]);
          this.ADL = this.context.getRawSeriesWrapper(this.helper, "ADL");
          this.ADLSum = this.context.getRawSeriesWrapper(this.helper, "ADLSum");
          this.VolumeSum = this.context.getRawSeriesWrapper(this.helper, "VolumeSum");
        };

        this.calculate = function (this: any, index: any) {
          var high = this.HIGH.getValue(index);
          var low = this.LOW.getValue(index);
          var close = this.CLOSE.getValue(index);
          var volume = this.VOLUME.getValue(index);
          var lastADL = this.ADL.getValue(index - 1);
          var lastADLSum = this.ADLSum.getValue(index - 1);
          var lastVolumeSum = this.VolumeSum.getValue(index - 1);

          var adl = 0;
          if (
            high === null ||
            low === null ||
            close === null ||
            volume === null ||
            high - low === 0
          ) {
            adl = 0;
          } else {
            adl = ((close - low - high + close) / (high - low)) * volume;
          }

          var adlSum = lastADLSum + adl - this.ADL.getValue(index - this.PERIODS);
          var volumeSum = lastVolumeSum + volume - this.VOLUME.getValue(index - this.PERIODS);

          this.ADL.setValue(index, adl);
          this.ADLSum.setValue(index, adlSum);
          this.VolumeSum.setValue(index, volumeSum);

          if (volumeSum) {
            this.CMFValue.setValue(index, adlSum / volumeSum);
          }
        };
    }),
  });
}
