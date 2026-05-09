import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createENVELOPEIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "envelopeTitle",
    description: "envelopeDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "priceClose", properties: { def: "c" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 0 }, value: 14 },
      VSHIFT: {
        type: "double",
        name: "verticalShift",
        properties: { max: 200, min: 0, step: 0.01 },
        value: 5,
      },
      UNITS: {
        type: "list",
        name: "value",
        properties: {},
        list: ["Percentage", "Value"],
        value: "Percentage",
      },
    },

    outputs: {
      ENVELOPE: {
        type: "series",
        series: {
          seriesId: null,
          title: "envelopeDescription",
          labels: ["envelopeUp", "envelopeDown"],
          fields: ["ENVELOPE_UP", "ENVELOPE_DN"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ENVELOPE",
        renderAs: "Line",
        dataField: "ENVELOPE_UP",
        color: "#e91e63",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "ENVELOPE",
        renderAs: "Line",
        dataField: "ENVELOPE_DN",
        color: "#e91e63",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],
    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var avg = FUSION.lib.getMA(this.CLOSE, index, this.PERIODS);
          if (avg === null) return;

          if (this.UNITS == undefined || this.UNITS === null || this.UNITS === "Percentage") {
            this.ENVELOPE_UP.setValue(index, avg * (1 + this.VSHIFT / 100));
            this.ENVELOPE_DN.setValue(index, avg * (1 - this.VSHIFT / 100));
          } else {
            this.ENVELOPE_UP.setValue(index, avg + this.VSHIFT);
            this.ENVELOPE_DN.setValue(index, avg - this.VSHIFT);
          }
        };
    }),
  });
}
