import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createWILLIAMSALLIGATORIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "williamsAlligatorTitle",
    description: "williamsAlligatorDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      JAWPERIODS: {
        type: "integer",
        name: "jawPeriods",
        properties: { max: 200, min: 0 },
        value: 13,
      },
      TEETHPERIODS: {
        type: "integer",
        name: "teethPeriods",
        properties: { max: 200, min: 0 },
        value: 8,
      },
      LIPSPERIODS: {
        type: "integer",
        name: "lipsPeriods",
        properties: { max: 200, min: 0 },
        value: 5,
      },
      JAWOFFSET: { type: "integer", name: "jawOffset", properties: { max: 200, min: 0 }, value: 8 },
      TEETHOFFSET: {
        type: "integer",
        name: "teethOffset",
        properties: { max: 200, min: 0 },
        value: 5,
      },
      LIPSOFFSET: {
        type: "integer",
        name: "lipsOffset",
        properties: { max: 200, min: 0 },
        value: 3,
      },
    },

    outputs: {
      WILLIAMSALLIGATOR: {
        type: "series",
        series: {
          seriesId: null,
          title: "williamsAlligatorTitle",
          labels: ["jaw", "teeth", "lips"],
          fields: ["JAW", "TEETH", "LIPS"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "WILLIAMSALLIGATOR",
        renderAs: "Line",
        dataField: "JAW",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
      },
      {
        type: "SeriesObject",
        dataLink: "WILLIAMSALLIGATOR",
        renderAs: "Line",
        dataField: "TEETH",
        color: "#ee4336",
        width: 1.5,
        dash: [],
      },
      {
        type: "SeriesObject",
        dataLink: "WILLIAMSALLIGATOR",
        renderAs: "Line",
        dataField: "LIPS",
        color: "#8bc349",
        width: 1.5,
        dash: [],
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var close = this.CLOSE.getValue(index);

          var lastJaw = this.JAW.getValue(index + this.JAWOFFSET - 1);
          if (lastJaw) {
            this.JAW.setValue(
              index + this.JAWOFFSET,
              (lastJaw * (this.JAWPERIODS - 1) + close) / this.JAWPERIODS
            );
          } else {
            this.JAW.setValue(
              index + this.JAWOFFSET,
              FUSION.lib.getMA(this.CLOSE, index, this.JAWPERIODS)
            );
          }

          var lastTeeth = this.TEETH.getValue(index + this.TEETHOFFSET - 1);
          if (lastTeeth) {
            this.TEETH.setValue(
              index + this.TEETHOFFSET,
              (lastTeeth * (this.TEETHPERIODS - 1) + close) / this.TEETHPERIODS
            );
          } else {
            this.TEETH.setValue(
              index + this.TEETHOFFSET,
              FUSION.lib.getMA(this.CLOSE, index, this.TEETHPERIODS)
            );
          }

          var lastLips = this.LIPS.getValue(index + this.LIPSOFFSET - 1);
          if (lastLips) {
            this.LIPS.setValue(
              index + this.LIPSOFFSET,
              (lastLips * (this.LIPSPERIODS - 1) + close) / this.LIPSPERIODS
            );
          } else {
            this.LIPS.setValue(
              index + this.LIPSOFFSET,
              FUSION.lib.getMA(this.CLOSE, index, this.LIPSPERIODS)
            );
          }
        };
    }),
  });
}
