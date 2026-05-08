import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDIRMOVIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "dirmovTitle",
    description: "dirmovDescription",
    type: "indicators",
    newPane: true,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIOD: { type: "integer", name: "rovPeriods", properties: { max: 200, min: 0 }, value: 14 },
    },

    outputs: {
      DIRMOV: {
        type: "series",
        series: {
          seriesId: null,
          title: "dirmovDescription",
          labels: ["pdi", "mdi"],
          fields: ["DIRMOV_MDI", "DIRMOV_PDI"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DIRMOV",
        renderAs: "Line",
        dataField: "DIRMOV_PDI",
        color: "#00bcd4",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "DIRMOV",
        renderAs: "Line",
        dataField: "DIRMOV_MDI",
        color: "#f44336",
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
      var DIRMOVController: FusionScriptControllerConstructor = function (
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
            "MDM",
            "MMAU",
            "MMAD",
            "PDM",
            "PMAU",
            "PMAD",
            "TRUERANGE",
          ]);
          this.MDM = this.context.getRawSeriesWrapper(this.helper, "MDM");
          this.MMAU = this.context.getRawSeriesWrapper(this.helper, "MMAU");
          this.MMAD = this.context.getRawSeriesWrapper(this.helper, "MMAD");
          this.PDM = this.context.getRawSeriesWrapper(this.helper, "PDM");
          this.PMAU = this.context.getRawSeriesWrapper(this.helper, "PMAU");
          this.PMAD = this.context.getRawSeriesWrapper(this.helper, "PMAD");
          this.TRUERANGE = this.context.getRawSeriesWrapper(this.helper, "TRUERANGE");
        };

        this.calculate = function (this: any, index: any) {
          if (
            this.LOW.getValue(index) === null ||
            this.LOW.getValue(index - 1) === null ||
            this.HIGH.getValue(index) === null ||
            this.HIGH.getValue(index - 1) === null
          )
            return;
          var tmp = 0;
          var ptmp = 0;
          if (index > 0) {
            tmp = this.LOW.getValue(index - 1) - this.LOW.getValue(index);
            ptmp = this.HIGH.getValue(index) - this.HIGH.getValue(index - 1);
          }
          if (tmp < 0) tmp = 0;
          if (ptmp < 0) ptmp = 0;

          this.MDM.setValue(index, tmp);
          this.PDM.setValue(index, ptmp);
          this.TRUERANGE.setValue(
            index,
            FUSION.lib.getTrueRange(this.HIGH, this.LOW, this.CLOSE, index)
          );
          this.MMAU.setValue(index, FUSION.lib.getMMA(this.MDM, index, this.PERIOD, this.MMAU));
          this.MMAD.setValue(
            index,
            FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.MMAD)
          );

          this.PMAU.setValue(index, FUSION.lib.getMMA(this.PDM, index, this.PERIOD, this.PMAU));
          this.PMAD.setValue(
            index,
            FUSION.lib.getMMA(this.TRUERANGE, index, this.PERIOD, this.PMAD)
          );

          if (
            this.MMAU.getValue(index) === null ||
            this.PMAU.getValue(index) === null ||
            this.MMAD.getValue(index) === null ||
            this.PMAD.getValue(index) === null
          ) {
            return;
          }

          this.DIRMOV_MDI.setValue(
            index,
            (100 * this.MMAU.getValue(index)) / this.MMAD.getValue(index)
          );
          this.DIRMOV_PDI.setValue(
            index,
            (100 * this.PMAU.getValue(index)) / this.PMAD.getValue(index)
          );
        };
      };
      return new DIRMOVController(context, inputs, outputs);
    },
  };
}
