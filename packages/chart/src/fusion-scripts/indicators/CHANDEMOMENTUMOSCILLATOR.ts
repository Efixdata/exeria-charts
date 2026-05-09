import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCHANDEMOMENTUMOSCILLATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "chandeMomentumOscillatorTitle",
    description: "chandeMomentumOscillatorDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "period", properties: { max: 200, min: 0 }, value: 20 },
    },
    outputs: {
      CMO: {
        type: "series",
        series: {
          seriesId: null,
          title: "chandeMomentumOscillatorTitle",
          labels: ["value"],
          fields: ["CMO"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CMO",
        renderAs: "Line",
        dataField: "CMO",
        color: "#009688",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["SUMUP", "UPVALUE", "SUMDOWN", "DOWNVALUE"]);
          this.SUMUP = this.context.getRawSeriesWrapper(this.helper, "SUMUP");
          this.UPVALUE = this.context.getRawSeriesWrapper(this.helper, "UPVALUE");
          this.SUMDOWN = this.context.getRawSeriesWrapper(this.helper, "SUMDOWN");
          this.DOWNVALUE = this.context.getRawSeriesWrapper(this.helper, "DOWNVALUE");
        };

        this.calculate = function (this: any, index: any) {
          var lastClose = this.CLOSE.getValue(index - 1);
          var close = this.CLOSE.getValue(index);
          var upValue = 0;
          var downValue = 0;

          if (close === null || lastClose == null) {
            return;
          }

          if (close > lastClose) {
            upValue = close - lastClose;
          } else {
            downValue = lastClose - close;
          }

          this.UPVALUE.setValue(index, upValue);
          this.DOWNVALUE.setValue(index, downValue);

          var sumUp =
            this.SUMUP.getValue(index - 1) + upValue - this.UPVALUE.getValue(index - this.PERIOD);
          var sumDown =
            this.SUMDOWN.getValue(index - 1) +
            downValue -
            this.DOWNVALUE.getValue(index - this.PERIOD);

          this.SUMUP.setValue(index, sumUp);
          this.SUMDOWN.setValue(index, sumDown);

          if (index < this.PERIOD) return;

          var cmo = (100 * (sumUp - sumDown)) / (sumUp + sumDown);

          this.CMO.setValue(index, cmo);
        };
    }),
  });
}
