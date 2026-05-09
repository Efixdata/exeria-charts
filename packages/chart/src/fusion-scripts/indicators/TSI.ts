import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createTSIIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "tsiTitle",
    description: "tsiDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      SHORTPERIOD: {
        type: "integer",
        name: "shortPeriod",
        properties: { def: 13, max: 100, min: 1 },
        value: 13,
      },
      LONGPERIOD: {
        type: "integer",
        name: "longPeriod",
        properties: { def: 25, max: 100, min: 1 },
        value: 25,
      },
      SIGNALPERIOD: {
        type: "integer",
        name: "signalPeriod",
        properties: { def: 13, max: 100, min: 0 },
        value: 13,
      },
    },

    outputs: {
      TSI: {
        type: "series",
        series: {
          seriesId: null,
          title: "tsiTitle",
          labels: ["value", "signal"],
          fields: ["TSI", "TSISIGNAL"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "TSI",
        renderAs: "Line",
        dataField: "TSI",
        color: "#03a9f4",
        width: 1,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "TSI",
        renderAs: "Line",
        dataField: "TSISIGNAL",
        color: "#e91e63",
        width: 1,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["PC", "APC", "PCS", "PCDS", "APCS", "APCDS"]);
          this.PC = this.context.getRawSeriesWrapper(this.helper, "PC");
          this.PCS = this.context.getRawSeriesWrapper(this.helper, "PCS");
          this.PCDS = this.context.getRawSeriesWrapper(this.helper, "PCDS");
          this.APC = this.context.getRawSeriesWrapper(this.helper, "APC");
          this.APCS = this.context.getRawSeriesWrapper(this.helper, "APCS");
          this.APCDS = this.context.getRawSeriesWrapper(this.helper, "APCDS");
        };

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);

          if (close === null || lastClose === null) return;

          var pc = close - lastClose;
          this.PC.setValue(index, pc);

          var pcs = FUSION.lib.getEMA(this.PC, index, this.LONGPERIOD, this.PCS);
          if (pcs == null) return;
          this.PCS.setValue(index, pcs);

          var pcds = FUSION.lib.getEMA(this.PCS, index, this.SHORTPERIOD, this.PCDS);
          if (pcds == null) return;
          this.PCDS.setValue(index, pcds);

          this.APC.setValue(index, Math.abs(pc));

          var apcs = FUSION.lib.getEMA(this.APC, index, this.LONGPERIOD, this.APCS);
          if (apcs == null) return;
          this.APCS.setValue(index, apcs);

          var apcds = FUSION.lib.getEMA(this.APCS, index, this.SHORTPERIOD, this.APCDS);
          if (apcds == null) return;
          this.APCDS.setValue(index, apcds);

          this.TSI.setValue(index, (pcds / apcds) * 100);

          var signal = FUSION.lib.getEMA(this.TSI, index, this.SIGNALPERIOD, this.TSISIGNAL);
          this.TSISIGNAL.setValue(index, signal);
        };
    }),
  });
}
