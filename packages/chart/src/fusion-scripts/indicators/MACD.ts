import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMACDIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "macdTitle",
    description: "macdDescription",
    type: "indicators",
    newPane: true,
    centerZero: true,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      FPERIOD: {
        type: "integer",
        name: "firstPeriod",
        properties: { def: 12, max: 100, min: 0 },
        value: 12,
      },
      SPERIOD: {
        type: "integer",
        name: "secondPeriod",
        properties: { def: 26, max: 100, min: 0 },
        value: 26,
      },
      SGPERIOD: {
        type: "integer",
        name: "signalPeriod",
        properties: { def: 9, max: 100, min: 0 },
        value: 9,
      },
    },

    outputs: {
      MACD: {
        type: "series",
        series: {
          seriesId: null,
          title: "macdTitle",
          labels: ["line", "signal", "histogram"],
          fields: ["MACDLine", "MACDSignal", "MACDHistogram"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MACD",
        renderAs: "Line and Histogram",
        dataField: "MACDHistogram",
        color: "#ff9800",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "MACD",
        renderAs: "Line",
        dataField: "MACDSignal",
        color: "#f44336",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "MACD",
        renderAs: "Line",
        dataField: "MACDLine",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: true,
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var MACDController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.init = function (this: any) {
          this.helper = this.context.createSeries(["EMAF", "EMAS", "EMAG"]);
          this.EMAF = this.context.getRawSeriesWrapper(this.helper, "EMAF");
          this.EMAS = this.context.getRawSeriesWrapper(this.helper, "EMAS");
          this.EMAG = this.context.getRawSeriesWrapper(this.helper, "EMAG");
        };

        this.calculate = function (this: any, index: any) {
          this.EMAF.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.FPERIOD, this.EMAF));
          this.EMAS.setValue(index, FUSION.lib.getEMA(this.CLOSE, index, this.SPERIOD, this.EMAS));

          var fema = this.EMAF.getValue(index);
          var sema = this.EMAS.getValue(index);

          if (fema === null || sema === null) return;

          this.MACDLine.setValue(index, fema - sema);

          this.EMAG.setValue(
            index,
            FUSION.lib.getEMA(this.MACDLine, index, this.SGPERIOD, this.EMAG)
          );
          var sgema = this.EMAG.getValue(index);
          this.MACDSignal.setValue(index, sgema);
          this.MACDHistogram.setValue(
            index,
            this.MACDLine.getValue(index) - this.MACDSignal.getValue(index)
          );
        };
      };

      return new MACDController(context, inputs, outputs);
    },
  };
}
