import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createSMIIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "smiTitle",
    description: "smiDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "periods", properties: { max: 100, min: 0 }, value: 12 },
      K_SLOW_PERIOD: {
        type: "integer",
        name: "kSlowPeriod",
        properties: { def: 3, max: 100, min: 0 },
        value: 3,
      },
      D_SLOW_PERIOD: {
        type: "integer",
        name: "dSlowPeriod",
        properties: { def: 3, max: 100, min: 0 },
        value: 3,
      },
      SIGNAL_PERIOD: {
        type: "integer",
        name: "signalPeriod",
        properties: { def: 3, max: 100, min: 0 },
        value: 3,
      },
      HI_BASELINE: {
        type: "integer",
        name: "hiBaseline",
        properties: { def: 50, max: 100, min: -100 },
        value: 50,
      },
      LO_BASELINE: {
        type: "integer",
        name: "loBaseline",
        properties: { def: -50, max: 100, min: -100 },
        value: -50,
      },
    },

    outputs: {
      SMI: {
        type: "series",
        series: {
          seriesId: null,
          title: "smiDescription",
          labels: ["smiTitle", "SMISignal", "SMIBaseHI", "SMIBaseLO"],
          fields: ["SMI", "SMISignal", "SMIBaseHI", "SMIBaseLO"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "SMI",
        renderAs: "Line",
        dataField: "SMI",
        color: "#f44336",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "SMI",
        renderAs: "Line",
        dataField: "SMISignal",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "SMI",
        renderAs: "Line",
        dataField: "SMIBaseHI",
        color: "#607d8b",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "SMI",
        renderAs: "Line",
        dataField: "SMIBaseLO",
        color: "#607d8b",
        width: 1,
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
      var SMIController: FusionScriptControllerConstructor = function (
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
          this.helper = this.context.createSeries([
            "CMSERIES",
            "HLSERIES",
            "CMEMA",
            "CMEMA2",
            "HLEMA",
            "HLEMA2",
          ]);
          this.CMSERIES = this.context.getRawSeriesWrapper(this.helper, "CMSERIES");
          this.HLSERIES = this.context.getRawSeriesWrapper(this.helper, "HLSERIES");
          this.CMEMA = this.context.getRawSeriesWrapper(this.helper, "CMEMA");
          this.CMEMA2 = this.context.getRawSeriesWrapper(this.helper, "CMEMA2");
          this.HLEMA = this.context.getRawSeriesWrapper(this.helper, "HLEMA");
          this.HLEMA2 = this.context.getRawSeriesWrapper(this.helper, "HLEMA2");
        };

        this.calculate = function (this: any, index: any) {
          this.CMSERIES.setValue(index, 0);
          this.HLSERIES.setValue(index, 0);

          this.CMEMA.setValue(index, 0);
          this.HLEMA.setValue(index, 0);
          this.CMEMA2.setValue(index, 0);
          this.HLEMA2.setValue(index, 0);

          this.SMIBaseHI.setValue(index, this.HI_BASELINE);
          this.SMIBaseLO.setValue(index, this.LO_BASELINE);

          var lo = FUSION.lib.getMin(this.LOW, index, this.PERIOD);
          var hi = FUSION.lib.getMax(this.HIGH, index, this.PERIOD);
          var diff = hi - lo;

          if (this.CLOSE.getValue(index) === null || lo === null || hi === null) return;
          this.CMSERIES.setValue(index, this.CLOSE.getValue(index) - 0.5 * (hi + lo));
          this.HLSERIES.setValue(index, diff);

          this.CMEMA.setValue(
            index,
            FUSION.lib.getEMA(this.CMSERIES, index, this.K_SLOW_PERIOD, this.CMEMA)
          );
          this.HLEMA.setValue(
            index,
            FUSION.lib.getEMA(this.HLSERIES, index, this.D_SLOW_PERIOD, this.HLEMA)
          );

          this.CMEMA2.setValue(
            index,
            FUSION.lib.getEMA(this.CMEMA, index, this.K_SLOW_PERIOD, this.CMEMA2)
          );
          this.HLEMA2.setValue(
            index,
            FUSION.lib.getEMA(this.HLEMA, index, this.D_SLOW_PERIOD, this.HLEMA2)
          );

          this.SMI.setValue(
            index,
            (100 * this.CMEMA2.getValue(index)) / (0.5 * this.HLEMA2.getValue(index))
          );
          this.SMISignal.setValue(
            index,
            FUSION.lib.getEMA(this.SMI, index, this.SIGNAL_PERIOD, this.SMISignal)
          );
        };
      };
      return new SMIController(context, inputs, outputs);
    },
  };
}
