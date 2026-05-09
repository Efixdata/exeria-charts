import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { createController, defineScript } from "../helpers/scriptDefinition";

export default function createFIBONACCIFunctionScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "fibonacciTitle",
    description: "fibonacciDescription",
    type: "functions",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERIODS: { type: "integer", name: "periods", properties: { max: 200, min: 1 }, value: 24 },
    },

    outputs: {
      FIBONACCI: {
        type: "series",
        series: {
          seriesId: null,
          title: "fibonacciTitle",
          labels: [
            "fibonacciValue0",
            "fibonacciValue2",
            "fibonacciValue3",
            "fibonacciValue4",
            "fibonacciValue6",
            "fibonacciValue7",
          ],
          fields: [
            "FIBONACCI0",
            "FIBONACCI2",
            "FIBONACCI3",
            "FIBONACCI4",
            "FIBONACCI6",
            "FIBONACCI7",
          ],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI0",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI2",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI3",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI4",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI6",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "FIBONACCI",
        renderAs: "Line",
        dataField: "FIBONACCI7",
        color: "#ff9800",
        width: 1.5,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {

        this.init = function (this: any) {};

        this.calculate = function (this: any, index: any) {
          var highest = FUSION.lib.getMax(this.HIGH, index, this.PERIODS);
          var lowest = FUSION.lib.getMin(this.LOW, index, this.PERIODS);

          if (!highest || !lowest) return;

          this.FIBONACCI0.setValue(index, lowest);
          this.FIBONACCI2.setValue(index, lowest + 0.382 * (highest - lowest));
          this.FIBONACCI3.setValue(index, lowest + 0.5 * (highest - lowest));
          this.FIBONACCI4.setValue(index, lowest + 0.618 * (highest - lowest));
          this.FIBONACCI6.setValue(index, highest);
          this.FIBONACCI7.setValue(index, lowest + 1.618 * (highest - lowest));
        };
    }),
  });
}
