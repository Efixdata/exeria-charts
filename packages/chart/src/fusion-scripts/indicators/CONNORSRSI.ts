import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createCONNORSRSIIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "connorsRsiTitle",
    description: "connorsRsiDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      RSIPERIODS: {
        type: "integer",
        name: "rsiPeriods",
        properties: { max: 200, min: 0 },
        value: 3,
      },
      UPDOWNPERIODS: {
        type: "integer",
        name: "upDownPeriods",
        properties: { max: 200, min: 0 },
        value: 2,
      },
      ROCPERIODS: {
        type: "integer",
        name: "rocPeriods",
        properties: { max: 200, min: 0 },
        value: 100,
      },
      UPPERBANDVALUE: {
        type: "double",
        name: "upperBand",
        properties: { def: 70, max: 100, min: 0 },
        value: 70,
      },
      LOWERBANDVALUE: {
        type: "double",
        name: "lowerBand",
        properties: { def: 30, max: 100, min: 0 },
        value: 30,
      },
    },

    outputs: {
      CONNORSRSI: {
        type: "series",
        series: {
          seriesId: null,
          title: "connorsRsiTitle",
          labels: ["connorsRsiTitle", "upperBand", "lowerBand"],
          fields: ["CONNORSRSI", "UPPERBAND", "LOWERBAND"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "CONNORSRSI",
        renderAs: "Line",
        dataField: "CONNORSRSI",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "CONNORSRSI",
        renderAs: "Line",
        dataField: "UPPERBAND",
        color: "#607d8b",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "CONNORSRSI",
        renderAs: "Line",
        dataField: "LOWERBAND",
        color: "#607d8b",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "AU",
            "AD",
            "MAU",
            "MAD",
            "RSI, UPDOWNLENGTH",
            "UPDOWNLENGTHAU",
            "UPDOWNLENGTHAD",
            "UPDOWNLENGTHMAU",
            "UPDOWNLENGTHMAD",
            "UPDOWNLENGTHRSI",
            "ROC",
          ]);

          // RSI
          this.RSI = this.context.getRawSeriesWrapper(this.helper, "RSI");
          this.AU = this.context.getRawSeriesWrapper(this.helper, "AU");
          this.AD = this.context.getRawSeriesWrapper(this.helper, "AD");
          this.MAU = this.context.getRawSeriesWrapper(this.helper, "MAU");
          this.MAD = this.context.getRawSeriesWrapper(this.helper, "MAD");

          this.UPDOWNLENGTH = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTH");
          this.UPDOWNLENGTHRSI = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTHRSI");
          this.UPDOWNLENGTHAU = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTHAU");
          this.UPDOWNLENGTHAD = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTHAD");
          this.UPDOWNLENGTHMAU = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTHMAU");
          this.UPDOWNLENGTHMAD = this.context.getRawSeriesWrapper(this.helper, "UPDOWNLENGTHMAD");

          this.ROC = this.context.getRawSeriesWrapper(this.helper, "ROC");
        };

        this.calculate = function (this: any, index: any) {
          this.UPPERBAND.setValue(index, this.UPPERBANDVALUE);
          this.LOWERBAND.setValue(index, this.LOWERBANDVALUE);

          var close = this.CLOSE.getValue(index);
          var lastClose = this.CLOSE.getValue(index - 1);

          // RSI
          FUSION.lib.calculateRSI(
            index,
            this.CLOSE,
            this.RSI,
            this.AU,
            this.AD,
            this.MAU,
            this.MAD,
            this.UPPERBANDVALUE,
            this.LOWERBANDVALUE,
            this.RSIPERIODS
          );

          // UPDOWN
          var lastUpDownLength = this.UPDOWNLENGTH.getValue(index - 1);

          if (close === null || lastClose === null) {
            this.UPDOWNLENGTH.setValue(index, 0);
          } else if (close < lastClose) {
            if (lastUpDownLength < 0) this.UPDOWNLENGTH.setValue(index, lastUpDownLength - 1);
            else this.UPDOWNLENGTH.setValue(index, -1);
          } else if (close > lastClose) {
            if (lastUpDownLength > 0) this.UPDOWNLENGTH.setValue(index, lastUpDownLength + 1);
            else this.UPDOWNLENGTH.setValue(index, 1);
          } else {
            this.UPDOWNLENGTH.setValue(index, 0);
          }

          FUSION.lib.calculateRSI(
            index,
            this.UPDOWNLENGTH,
            this.UPDOWNLENGTHRSI,
            this.UPDOWNLENGTHAU,
            this.UPDOWNLENGTHAD,
            this.UPDOWNLENGTHMAU,
            this.UPDOWNLENGTHMAD,
            this.UPPERBANDVALUE,
            this.LOWERBANDVALUE,
            this.UPDOWNPERIODS
          );

          // ROC (DIFFERENT THAN ROC INDICATOR)
          if (index < this.ROCPERIODS) return;

          var pricesBelowCurrentClose = 0;
          var priceChange = (100 * (close - lastClose)) / lastClose;

          for (var i = index - 1; i > index - this.ROCPERIODS; --i) {
            var pc =
              (100 * (this.CLOSE.getValue(i) - this.CLOSE.getValue(i - 1))) /
              this.CLOSE.getValue(i - 1);
            if (pc < priceChange) ++pricesBelowCurrentClose;
          }

          var roc = (100 * pricesBelowCurrentClose) / this.ROCPERIODS;

          var crsi = (this.RSI.getValue(index) + this.UPDOWNLENGTHRSI.getValue(index) + roc) / 3;
          this.CONNORSRSI.setValue(index, crsi);
        };
    }),
  });
}
