import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createMASSINDEXIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "massIndexTitle",
    description: "massIndexDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: 1 }, value: 24 },
      EMAPERIODS: {
        type: "integer",
        name: "EMAPeriods",
        properties: { max: 100, min: 1 },
        value: 9,
      },
    },

    outputs: {
      MASSINDEX: {
        type: "series",
        series: {
          seriesId: null,
          title: "massIndexTitle",
          labels: ["value"],
          fields: ["MassIndex"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "MASSINDEX",
        renderAs: "Line",
        dataField: "MassIndex",
        color: "#f44336",
        width: 1,
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
          this.helper = this.context.createSeries(["HL", "EMAHL", "EMAEMAHL", "MISUMMANDS", "MI"]);
          this.HL = this.context.getRawSeriesWrapper(this.helper, "HL");
          this.EMAHL = this.context.getRawSeriesWrapper(this.helper, "EMAHL");
          this.EMAEMAHL = this.context.getRawSeriesWrapper(this.helper, "EMAEMAHL");
          this.MISUMMANDS = this.context.getRawSeriesWrapper(this.helper, "MISUMMANDS");
          this.MI = this.context.getRawSeriesWrapper(this.helper, "MI");
        };

        this.calculate = function (this: any, index: any) {
          var high = this.HIGH.getValue(index);
          var low = this.LOW.getValue(index);
          if (high === null || low === null) return;

          this.HL.setValue(index, high - low);

          var emaHL = FUSION.lib.getEMA(this.HL, index, this.EMAPERIODS, this.EMAHL);
          if (emaHL === null) return;
          this.EMAHL.setValue(index, emaHL);

          var emaEmaHL = FUSION.lib.getEMA(this.EMAHL, index, this.EMAPERIODS, this.EMAEMAHL);
          if (emaEmaHL === null || emaEmaHL === 0) return;
          this.EMAEMAHL.setValue(index, emaEmaHL);

          this.MISUMMANDS.setValue(index, emaHL / emaEmaHL);

          var previousMassIndex = this.MI.getValue(index - 1) || 0;
          var mi =
            previousMassIndex +
            this.MISUMMANDS.getValue(index) -
            this.MISUMMANDS.getValue(index - this.PERIODS);
          this.MI.setValue(index, mi);

          if (index < this.PERIODS + this.EMAPERIODS * 2) return;

          this.MassIndex.setValue(index, mi);
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
