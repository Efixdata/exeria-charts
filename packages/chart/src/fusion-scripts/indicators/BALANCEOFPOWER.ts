import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createBALANCEOFPOWERIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "balanceOfPowerTitle",
    description: "balanceOfPowerDescription",
    type: "indicators",
    newPane: true,

    inputs: {
      OPEN: { type: "series", name: "priceOpen", properties: { def: "o" }, value: null },
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
    },

    outputs: {
      BALANCEOFPOWER: {
        type: "series",
        series: {
          seriesId: null,
          title: "balanceOfPowerTitle",
          labels: ["value"],
          fields: ["BALANCEOFPOWER"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "BALANCEOFPOWER",
        renderAs: "Line",
        dataField: "BALANCEOFPOWER",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: true,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          if (
            this.OPEN.getValue(index) === null ||
            this.HIGH.getValue(index) === null ||
            this.LOW.getValue(index) == null ||
            this.CLOSE.getValue(index) === null
          )
            return;

          this.BALANCEOFPOWER.setValue(
            index,
            (this.CLOSE.getValue(index) - this.OPEN.getValue(index)) /
              (this.HIGH.getValue(index) - this.LOW.getValue(index))
          );
        };
    }),
  });
}
