import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDECISIONLONGBUYIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "decisionLongBuyTitle",
    description: "decisionLongBuyDescription",
    subscriptionPack: "importerExporterTools",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "Price", properties: { def: "c" }, value: null },
    },

    outputs: {
      SIGNAL: {
        type: "series",
        series: {
          seriesId: null,
          title: "decisionLongBuyTitle",
          labels: ["signal"],
          fields: ["SignalValue"],
          data: null,
        },
      },
      SMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "smaTitle",
          labels: ["value"],
          fields: ["SMAValue"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "StrategyObject",
        dataLink: "SIGNAL",
        renderAs: "",
        dataField: "SignalValue",
        color: "#ff0000",
        width: 1,
        dash: [],
      },
      {
        type: "SeriesObject",
        dataLink: "SMA",
        renderAs: "Line",
        dataField: "SMAValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["returnRate"]);
          this.returnRate = this.context.getRawSeriesWrapper(this.helper, "returnRate");

          this.PERIODS = 24;
          this.PROGNOSIS_PERIODS = 480;
          this.PROBABILITY = (1 - 50 / 100) / 2;
        };
        this.calculate = function (this: any, index: any) {
          var signal = FUSION.DO_NOTHING;
          this.SMAValue.setValue(
            index,
            FUSION.lib.getMA(this.CLOSE, index, this.PROGNOSIS_PERIODS)
          );
          this.returnRate.setValue(index, FUSION.lib.getReturnRate(this.CLOSE, index));

          if (index > this.PROGNOSIS_PERIODS + this.PERIODS) {
            var values = FUSION.lib.getForecastAverage(
              this.CLOSE,
              this.returnRate,
              index,
              this.PERIODS,
              this.PROGNOSIS_PERIODS,
              this.PROBABILITY
            );
            if (this.CLOSE.getValue(index) < values.lower) {
              signal = FUSION.BUY;
            }
          }

          this.SignalValue.setValue(index, signal);
        };
    }),
  });
}
