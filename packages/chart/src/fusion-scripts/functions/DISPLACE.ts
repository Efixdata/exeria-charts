import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createDISPLACEFunctionScript(FUSION: CoreFusionStatic) {
  return defineScript({
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

    controller: createController(function (this: FusionScriptControllerRuntime) {
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
    }),
  });
}
