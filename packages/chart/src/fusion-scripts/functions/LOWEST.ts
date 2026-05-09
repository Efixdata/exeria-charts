import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createLOWESTFunctionScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "lowestTitle",
    description: "lowestDescription",
    type: "functions",
    newPane: false,
    inputs: {
      LOW: { type: "series", name: "price", properties: { def: "l" }, value: null },
      PERIODS: {
        type: "integer",
        name: "period",
        properties: { def: 25, max: 100, min: 0 },
        value: 25,
      },
    },

    outputs: {
      LOWEST: {
        type: "series",
        series: {
          seriesId: null,
          title: "lowestTitle",
          labels: ["value"],
          fields: ["LOWEST"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "LOWEST",
        renderAs: "Line",
        dataField: "LOWEST",
        color: "#ff5722",
        width: 1.5,
        dash: [],
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function (this: any) {};

      this.calculate = function (this: any, index: any) {
        this.LOWEST.setValue(index, FUSION.lib.getMin(this.LOW, index, this.PERIODS));
      };
    }),
  });
}
