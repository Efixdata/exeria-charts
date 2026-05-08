import { calcLine } from "../../utils/objects-lib";
import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createOBJECTHiddenScript(FUSION: CoreFusionStatic) {
  return {
    title: "objectTitle",
    userName: "objectUserName",
    description: "objectDescription",
    type: "hidden",
    newPane: false,
    visible: false,
    permHide: true,

    inputs: {
      OBJECT: { type: "object", name: "line", properties: {}, value: null, hidden: true },
    },

    outputs: {
      LINE_SERIES: {
        type: "series",
        series: {
          seriesId: null,
          title: "lineSeries",
          labels: ["value"],
          fields: ["Value"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "LINE_SERIES",
        renderAs: "Line",
        dataField: "Value",
        color: "#ffc107",
        width: 1,
        dash: [],
      },
    ],
    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var ObjectIndicatorController: FusionScriptControllerConstructor = function (
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
          this.updateAnchors();
        };

        this.updateAnchors = function (this: any) {
          var self = this;
          var len = this.Value.getSeriesLength();
          var lastIndex = len - 1;
          var lastStamp = this.Value.getStamp(lastIndex);
          this.OBJECT.anchors.forEach(function (a: Record<string, any>) {
            var anchorStamp = a.stamp;
            if (anchorStamp > lastStamp) {
              var lastIndex = self.getStampIndex(lastStamp);
              var offsetIndex = Math.round(
                (anchorStamp - lastStamp) / self.context.getMainSeries().interval.milis
              );
              a._index = Math.round(lastIndex + offsetIndex);
            } else if (anchorStamp < 0) {
              a._index = -1;
            } else {
              a._index = self.getStampIndex(anchorStamp);
            }
          });
        };

        this.calculate = function (this: any, index: any) {
          if (!this.OBJECT.type) {
            this.Value.setValue(index, 1);
            return;
          }

          if (index == 0) {
            this.updateAnchors();
          }

          if (this.OBJECT.type == "trendLine") {
            var v1 = this.OBJECT.anchors[0].value;
            var v2 = this.OBJECT.anchors[1].value;
            var i1 = this.OBJECT.anchors[0]._index;
            var i2 = this.OBJECT.anchors[1]._index;
            this.line = calcLine({ x: i1, y: v1 }, { x: i2, y: v2 });
            var v = this.line.a * index + this.line.b;
            this.Value.setValue(index, v);
          } else if (this.OBJECT.type == "hLine") {
            this.Value.setValue(index, this.OBJECT.anchors[0].value);
          }
        };

        this.getStampIndex = function (this: any, s: any) {
          var len = this.Value.getSeriesLength();
          var lastIndex = len - 1;

          for (var i = 0; i < len; i++) {
            var stamp = this.Value.getStamp(i);

            if (stamp == s) return i;

            if (i < lastIndex) {
              var nextStamp = this.Value.getStamp(i + 1);
              if (s > stamp && s < nextStamp) return i;
            }

            if (i == lastIndex) {
              var intervalInMilis = this.context.getMainSeries().interval.milis;
              if (s > stamp && s < stamp + intervalInMilis) return i;
            }
          }
          return -1;
        };
      };

      return new ObjectIndicatorController(context, inputs, outputs);
    },
  };
}
