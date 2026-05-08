import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createDISPLACEFunctionScript(FUSION: CoreFusionStatic) {
  return {
    title: "displaceTitle",
    description: "displaceDescription",
    type: "functions",
    newPane: false,
    inputs: {
      DSERIES: { type: "series", name: "series", properties: {}, value: null },
      VALUE: {
        type: "double",
        name: "value",
        properties: { max: 100, min: -100, step: 0.01 },
        value: 0.0,
      },
      PERIODS: { type: "integer", name: "periods", properties: { max: 100, min: -100 }, value: 12 },
    },

    outputs: {
      DISPLACE: {
        type: "series",
        series: {
          seriesId: null,
          title: "displaceTitle",
          labels: ["value"],
          fields: ["DISPLACE"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "DISPLACE",
        renderAs: "Line",
        dataField: "DISPLACE",
        color: "#e91e63",
        width: 1.5,
        dash: [],
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var DISPLACEController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;
        this.init = function (this: any) {};
        this.calculate = function (this: any, index: any) {
          var displace = FUSION.lib.displace(this.DSERIES, index, this.PERIODS);
          if (displace !== null) {
            this.DISPLACE.setValue(index, displace + this.VALUE);
          }

          if (index === this.DSERIES.getSeriesLength() - 1) this.addFutureValues(index + 1);
        };
        this.addFutureValues = function (this: any, index: any) {
          for (var i = 0; i < this.PERIODS; ++i) {
            if (FUSION.lib.displace(this.DSERIES, index, this.PERIODS) !== null) {
              this.DISPLACE.setValue(
                index + i,
                FUSION.lib.displace(this.DSERIES, index + i, this.PERIODS) + this.VALUE
              );
            }
          }
        };
      };

      return new DISPLACEController(context, inputs, outputs);
    },
  };
}
