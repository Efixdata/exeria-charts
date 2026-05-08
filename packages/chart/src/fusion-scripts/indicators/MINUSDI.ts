import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMINUSDIIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "minusdiTitle",
    description: "minusdiDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "rovPeriods", properties: { max: 200, min: 0 }, value: 14 },
    },

    outputs: {
      MINUSDI: {
        type: "series",
        series: {
          seriesId: null,
          title: "minusdiTitle",
          labels: ["minusdiTitle"],
          fields: ["MINUSDI"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MINUSDI",
        renderAs: "Line",
        dataField: "MINUSDI",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var MINUSDIController: FusionScriptControllerConstructor = function (
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
          this.helper = this.context.createSeries(["MDM", "MMAU", "MMAD", "TRUERANGE"]);
          this.MDM = this.context.getRawSeriesWrapper(this.helper, "MDM");
          this.MMAU = this.context.getRawSeriesWrapper(this.helper, "MMAU");
          this.MMAD = this.context.getRawSeriesWrapper(this.helper, "MMAD");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
        };

        this.calculate = function (this: any, index: any) {
          var tmp = 0;
          if (index > 0) {
            tmp = this.LOW.getValue(index - 1) - this.LOW.getValue(index);
          }
          if (tmp < 0) tmp = 0;

          this.MDM.setValue(index, tmp);
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );
          this.MMAU.setValue(index, FUSION.lib.getMMA(this.MDM, index, this.PERIOD, this.MMAU));
          this.MMAD.setValue(
            index,
            FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.MMAD)
          );

          if (this.MMAU.getValue(index) === null || this.MMAD.getValue(index) === null) return;

          this.MINUSDI.setValue(
            index,
            (100 * this.MMAU.getValue(index)) / this.MMAD.getValue(index)
          );
        };
      };
      return new MINUSDIController(context, inputs, outputs);
    },
  };
}
