import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createICHIMOKUIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "ichimokuTitle",
    description: "ichimokuDescription",
    type: "indicators",
    newPane: false,
    centerZero: true,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },

      CSDISPLACE: {
        type: "integer",
        name: "chikouSpanDisplace",
        properties: { def: 25, max: 100, min: 1 },
        value: 25,
      },
      TSPERIOD: {
        type: "integer",
        name: "tenkanSenPeriod",
        properties: { def: 9, max: 100, min: 2 },
        value: 9,
      },
      KSPERIOD: {
        type: "integer",
        name: "kijunSenPeriod",
        properties: { def: 26, max: 100, min: 2 },
        value: 26,
      },
      SSPERIOD: {
        type: "integer",
        name: "senkouSenPeriod",
        properties: { def: 52, max: 100, min: 2 },
        value: 52,
      },
    },

    outputs: {
      ICHIMOKU: {
        type: "series",
        series: {
          seriesId: null,
          title: "ichimokuTitle",
          labels: [
            "ichimokuTenkanSen",
            "ichimokuKijunSen",
            "ichimokuChikouSpan",
            "ichimokuSenkouA",
            "ichimokuSenkouB",
          ],
          fields: ["TenkanSen", "KijunSen", "ChikouSpan", "SenkouA", "SenkouB"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ICHIMOKU",
        renderAs: "Line",
        dataField: "TenkanSen",
        color: "#f44336",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "ICHIMOKU",
        renderAs: "Line",
        dataField: "KijunSen",
        color: "#03a9f4",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "ICHIMOKU",
        renderAs: "Line",
        dataField: "ChikouSpan",
        color: "#ffc107",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: true,
      },
      {
        type: "SeriesObject",
        dataLink: "ICHIMOKU",
        renderAs: "Band",
        upperField: "SenkouA",
        lowerField: "SenkouB",
        color: "#5b6f8b",
        width: 1,
        dash: [0, 0],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var ICHIMOKUController: FusionScriptControllerConstructor = function (
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
          this.helper = this.context.createSeries(["S1", "S2"]);
          this.S1 = this.context.getRawSeriesWrapper(this.helper, "S1");
          this.S2 = this.context.getRawSeriesWrapper(this.helper, "S2");
        };

        this.ichimokuFunc = function (this: any, serH: any, serL: any, idx: any, period: any) {
          var max = FUSION.lib.getMax(serH, idx, period);
          var min = FUSION.lib.getMin(serL, idx, period);
          if (max === null || min === null) return null;

          var result = (max + min) / 2;
          return result;
        };

        this.calculate = function (this: any, index: any) {
          var ts = this.ichimokuFunc(this.HIGH, this.LOW, index, this.TSPERIOD);
          var ks = this.ichimokuFunc(this.HIGH, this.LOW, index, this.KSPERIOD);

          this.TenkanSen.setValue(index, ts);
          this.KijunSen.setValue(index, ks);

          this.SenkouA.setValue(
            index + this.CSDISPLACE,
            this.ichimokuFunc(this.HIGH, this.LOW, index, this.SSPERIOD)
          );
          if (ts !== null && ks !== null) {
            this.SenkouB.setValue(index + this.CSDISPLACE, (ts + ks) / 2);
          }

          this.ChikouSpan.setValue(index, FUSION.lib.displace(this.CLOSE, index, -this.CSDISPLACE));
        };
      };

      return new ICHIMOKUController(context, inputs, outputs);
    },
  };
}
