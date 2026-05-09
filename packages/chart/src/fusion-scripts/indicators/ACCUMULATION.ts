import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createACCUMULATIONIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "accumulationTitle",
    description: "accumulationDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      INDICATOR: { type: "series", name: "indicator", properties: {}, value: null },
    },

    outputs: {
      ACCUMULATION: {
        type: "series",
        series: {
          seriesId: null,
          title: "accumulationTitle",
          labels: ["value"],
          fields: ["AccumulationValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ACCUMULATION",
        renderAs: "Line",
        dataField: "AccumulationValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["lastSignal"]);
          this.lastSignal = this.context.getRawSeriesWrapper(this.helper, "lastSignal");
        };

        this.onModify = function (this: any) {
          this.init();
        };

        this.calculate = function (this: any, index: any) {
          if (this.INDICATOR.getValue(index) === null) return;
          this.AccumulationValue.setValue(
            index,
            this.AccumulationValue.getValue(index - 1) + this.INDICATOR.getValue(index)
          );
        };
    }),
  });
}
