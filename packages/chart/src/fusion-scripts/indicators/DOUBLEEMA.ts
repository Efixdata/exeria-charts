import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDOUBLEEMAIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "doubleEmaTitle",
    description: "doubleEmaDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 9 },
    },

    outputs: {
      DOUBLEEMA: {
        type: "series",
        series: {
          seriesId: null,
          title: "doubleEmaTitle",
          labels: ["value"],
          fields: ["DOUBLEEMA"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DOUBLEEMA",
        renderAs: "Line",
        dataField: "DOUBLEEMA",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var Controller: FusionScriptControllerConstructor = function (
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
          this.helper = this.context.createSeries(["EMA", "EMAEMA"]);

          this.EMA = this.context.getRawSeriesWrapper(this.helper, "EMA");
          this.EMAEMA = this.context.getRawSeriesWrapper(this.helper, "EMAEMA");
        };

        this.calculate = function (this: any, index: any) {
          var ema = FUSION.lib.getEMA(this.CLOSE, index, this.PERIODS, this.EMA);
          this.EMA.setValue(index, ema);

          var emaema = FUSION.lib.getEMA(this.EMA, index, this.PERIODS, this.EMAEMA);
          this.EMAEMA.setValue(index, emaema);

          if (ema == null || emaema == null) return;

          var doubleEma = 2 * ema - emaema;

          this.DOUBLEEMA.setValue(index, doubleEma);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
