import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDINAPOLIMACDIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "diNapoliMacdTitle",
    description: "diNapoliMacdDescription",
    subscriptionPack: "diNapoliTools",
    type: "indicators",
    newPane: true,
    centerZero: true,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      SMOOTHINGFACTOR1: {
        type: "double",
        name: "smoothingFactor1",
        properties: { def: 0.213, max: 1, min: 0.001, step: 0.001 },
        value: 0.213,
      },
      SMOOTHINGFACTOR2: {
        type: "double",
        name: "smoothingFactor2",
        properties: { def: 0.108, max: 1, min: 0.001, step: 0.001 },
        value: 0.108,
      },
      SIGNALLINESMOOTHINGFACTOR: {
        type: "double",
        name: "signalLineSmoothingFactor",
        properties: { def: 0.199, max: 1, min: 0.001, step: 0.001 },
        value: 0.199,
      },
    },

    outputs: {
      MACD: {
        type: "series",
        series: {
          seriesId: null,
          title: "diNapoliMacdTitle",
          labels: ["line", "signal", "histogram"],
          fields: ["MACDLine", "MACDSignal"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MACD",
        renderAs: "Line",
        dataField: "MACDSignal",
        color: "#f403ea",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "MACD",
        renderAs: "Line",
        dataField: "MACDLine",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
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
          this.EMAF.setValue(
            index,
            FUSION.lib.getMMA(this.CLOSE, index, 1 / this.SMOOTHINGFACTOR1, this.EMAF)
          );
          this.EMAS.setValue(
            index,
            FUSION.lib.getMMA(this.CLOSE, index, 1 / this.SMOOTHINGFACTOR2, this.EMAS)
          );

          var fema = this.EMAF.getValue(index);
          var sema = this.EMAS.getValue(index);

          if (fema === null || sema === null) return;

          this.MACDLine.setValue(index, fema - sema);

          this.EMAG.setValue(
            index,
            FUSION.lib.getMMA(this.MACDLine, index, 1 / this.SIGNALLINESMOOTHINGFACTOR, this.EMAG)
          );
          var sgema = this.EMAG.getValue(index);
          this.MACDSignal.setValue(index, sgema);
        };
      };

      return new MACDController(context, inputs, outputs);
    },
  };
}
