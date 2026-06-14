import type { CoreFusionStatic } from "../../internal-types/fusion";
import type { FusionScriptControllerRuntime } from "../../internal-types/scripts";
import { getExternalNewsFeed } from "../../externalNewsFeed";
import { createController, createSeriesOutput, defineScript } from "../helpers/scriptDefinition";

function sentimentToMarkerValue(
  FUSION: CoreFusionStatic,
  sentiment: ExternalNewsSentiment,
): number {
  switch (sentiment) {
    case "positive":
      return FUSION.BUY;
    case "negative":
      return FUSION.SELL;
    default:
      return FUSION.EXIT_LONG;
  }
}

type ExternalNewsSentiment = import("../../externalNewsFeed").ExternalNewsSentiment;

export default function createNEWSFEEDIndicatorScript(FUSION: CoreFusionStatic) {
  return defineScript({
    title: "newsFeedTitle",
    description: "newsFeedDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      MARKER_SIZE: {
        type: "integer",
        name: "markerSize",
        properties: { max: 24, min: 3 },
        value: 6,
      },
      MARKER_SHAPE: {
        type: "list",
        name: "markerShape",
        properties: {},
        list: ["Circle", "Square", "Triangle"],
        value: "Circle",
      },
    },

    outputs: {
      NEWSFEED: createSeriesOutput("newsFeedTitle", ["sentiment"], ["NewsValue"]),
    },

    plotters: [
      {
        type: "NewsMarkerObject",
        dataLink: "NEWSFEED",
        renderAs: "",
        dataField: "NewsValue",
        color: "#3b82f6",
        buyColor: "#22c55e",
        sellColor: "#ef4444",
        neutralColor: "#3b82f6",
        width: 6,
        dash: [],
        renderLegend: true,
      },
    ],

    controller: createController(function (this: FusionScriptControllerRuntime) {
      this.init = function () {
        this._newsByBar = new Map<number, ExternalNewsSentiment>();
      };

      this.calculate = function (index: number) {
        if (!this._newsByBar) {
          this._newsByBar = new Map<number, ExternalNewsSentiment>();
        }

        if (index === 0) {
          this._newsByBar.clear();
          for (const point of getExternalNewsFeed()) {
            this._newsByBar.set(point.barIndex, point.sentiment);
          }
        }

        const sentiment = this._newsByBar.get(index);
        if (!sentiment) {
          this.NewsValue.setValue(index, 0);
          return;
        }

        const markerValue = sentimentToMarkerValue(FUSION, sentiment);
        const markerSize =
          typeof this.MARKER_SIZE === "number"
            ? this.MARKER_SIZE
            : Number(this.MARKER_SIZE) || 6;
        this.NewsValue.setValue(index, markerValue);
        this.NewsValue.setStrength(index, markerSize);
      };
    }),
  });
}
