import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCOPPOCKCURVEIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "coppockCurveTitle",
    description: "coppockCurveDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      WMAPERIOD: {
        type: "integer",
        name: "wmaPeriod",
        properties: { max: 200, min: 1 },
        value: 10,
      },
      LONGROCPERIOD: {
        type: "integer",
        name: "longRocPeriod",
        properties: { max: 200, min: 1 },
        value: 14,
      },
      SHORTROCPERIOD: {
        type: "integer",
        name: "shortRocPeriod",
        properties: { max: 200, min: 1 },
        value: 11,
      },
    },
    outputs: {
      COPPOCKCURVE: {
        type: "series",
        series: {
          seriesId: null,
          title: "coppockCurveTitle",
          labels: ["value"],
          fields: ["COPPOCKCURVE"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "COPPOCKCURVE",
        renderAs: "Line",
        dataField: "COPPOCKCURVE",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["ROCSUM"]);
          this.ROCSUM = this.context.getRawSeriesWrapper(this.helper, "ROCSUM");
        };

        this.calculate = function (this: any, index: any) {
          var shortROC = FUSION.lib.getPercentageROC(index, this.CLOSE, this.SHORTROCPERIOD);
          var longROC = FUSION.lib.getPercentageROC(index, this.CLOSE, this.LONGROCPERIOD);

          this.ROCSUM.setValue(index, shortROC + longROC);

          var coppockCurve = FUSION.lib.getWMA(this.ROCSUM, index, this.WMAPERIOD);
          this.COPPOCKCURVE.setValue(index, coppockCurve);
        };
    }),
  });
}
