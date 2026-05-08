import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createZIGZAGIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "zigzagTitle",
    description: "zigzagDescription",
    type: "indicators",
    newPane: false,
    inputs: {
      HIGH: { type: "series", name: "priceHigh", properties: { def: "h" }, value: null },
      LOW: { type: "series", name: "priceLow", properties: { def: "l" }, value: null },
      PERCENT: {
        type: "integer",
        name: "percent",
        properties: { def: 10, max: 999, min: 1 },
        value: 10,
      },
      EXTENDTOLASTBAR: { type: "boolean", name: "extendToLastBar", properties: {}, value: true },
    },
    outputs: {
      ZIGZAG: {
        type: "series",
        series: {
          seriesId: null,
          title: "zigzagTitle",
          labels: ["value"],
          fields: ["ZIGZAGValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "ZIGZAG",
        renderAs: "Line",
        dataField: "ZIGZAGValue",
        color: "#ff9800",
        width: 1.5,
        dash: [],
      },
    ],
    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var Controller: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.onModify = function (this: any) {
          this.init();
        };

        this.init = function (this: any) {
          this.helper = this.context.createSeries([
            "lastPeak",
            "lastThrough",
            "lastPeakIndex",
            "lastThroughIndex",
            "lastExtremeType",
          ]);
          this.lastPeak = this.context.getRawSeriesWrapper(this.helper, "lastPeak");
          this.lastThrough = this.context.getRawSeriesWrapper(this.helper, "lastThrough");
          this.lastPeakIndex = this.context.getRawSeriesWrapper(this.helper, "lastPeakIndex");
          this.lastThroughIndex = this.context.getRawSeriesWrapper(this.helper, "lastThroughIndex");
          this.lastExtremeType = this.context.getRawSeriesWrapper(this.helper, "lastExtremeType");
          this.change = this.PERCENT / 100;

          this.addValuesInBetween = function (
            this: any,
            startIndex: any,
            endIndex: any,
            startValue: any,
            endValue: any
          ) {
            var a = (startValue - endValue) / (startIndex - endIndex);
            var b = startValue - a * startIndex;
            for (var i = startIndex + 1; i < endIndex; ++i) {
              this.ZIGZAGValue.setValue(i, a * i + b);
            }
          };

          this.calculateWhenLastWasPeak = function (this: any, index: any) {
            var high = this.HIGH.getValue(index);
            var low = this.LOW.getValue(index);
            var lastPeak = this.lastPeak.getValue(index - 1) || high;
            var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
            var lastThrough = this.lastThrough.getValue(index - 1) || low;
            var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;

            this.lastExtremeType.setValue(index, 1);
            if (high > lastPeak) {
              lastPeak = high;
              this.lastPeak.setValue(index, high);
              this.ZIGZAGValue.setValue(index, high);
              this.addValuesInBetween(lastThroughIndex, index, lastThrough, lastPeak);
              this.lastPeakIndex.setValue(index, index);
              this.lastThrough.setValue(index, lastThrough);
              this.lastThroughIndex.setValue(index, lastThroughIndex);
              return;
            } else {
              this.lastPeak.setValue(index, lastPeak);
              this.lastPeakIndex.setValue(index, lastPeakIndex);
            }

            if (low < lastPeak - this.change * lastPeak) {
              this.lastThrough.setValue(index, low);
              this.ZIGZAGValue.setValue(index, low);
              this.addValuesInBetween(lastPeakIndex, index, lastPeak, low);
              this.lastExtremeType.setValue(index, -1);
              this.lastThroughIndex.setValue(index, index);
            } else {
              this.lastThrough.setValue(index, lastThrough);
              this.lastThroughIndex.setValue(index, lastThroughIndex);
            }
          }.bind(this);

          this.calculateWhenLastWasThrough = function (this: any, index: any) {
            var high = this.HIGH.getValue(index);
            var low = this.LOW.getValue(index);
            var lastPeak = this.lastPeak.getValue(index - 1) || high;
            var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
            var lastThrough = this.lastThrough.getValue(index - 1) || low;
            var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;

            this.lastExtremeType.setValue(index, -1);
            this.ZIGZAGValue.setValue(index, null);
            if (low < lastThrough) {
              lastThrough = low;
              this.lastThrough.setValue(index, low);
              this.addValuesInBetween(lastPeakIndex, index, lastPeak, lastThrough);
              this.ZIGZAGValue.setValue(index, low);
              this.lastThroughIndex.setValue(index, index);
              this.lastPeak.setValue(index, lastPeak);
              this.lastPeakIndex.setValue(index, lastPeakIndex);
              return;
            } else {
              this.lastThrough.setValue(index, lastThrough);
              this.lastThroughIndex.setValue(index, lastThroughIndex);
            }

            if (high > lastThrough + this.change * lastThrough) {
              this.lastPeak.setValue(index, high);
              this.ZIGZAGValue.setValue(index, high);
              this.addValuesInBetween(lastThroughIndex, index, lastThrough, high);
              this.lastPeakIndex.setValue(index, index);
              this.lastExtremeType.setValue(index, 1);
            } else {
              this.lastPeak.setValue(index, lastPeak);
              this.lastPeakIndex.setValue(index, lastPeakIndex);
            }
          }.bind(this);

          this.calculateWhenLastWasUnknown = function (this: any, index: any, lastWasThrough: any) {
            var high = this.HIGH.getValue(index);
            var low = this.LOW.getValue(index);
            var lastPeak = this.lastPeak.getValue(index - 1) || high;
            var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
            var lastThrough = this.lastThrough.getValue(index - 1) || low;
            var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;

            if (high > lastPeak) {
              lastPeak = high;
              lastPeakIndex = index;
              this.lastPeak.setValue(index, high);
              this.lastPeakIndex.setValue(index, index);
            } else {
              this.lastPeak.setValue(index, lastPeak);
              this.lastPeakIndex.setValue(index, lastPeakIndex);
            }

            if (low < lastThrough) {
              lastThrough = low;
              lastThroughIndex = index;
              this.lastThrough.setValue(index, low);
              this.lastThroughIndex.setValue(index, index);
            } else {
              this.lastThrough.setValue(index, lastThrough);
              this.lastThroughIndex.setValue(index, lastThroughIndex);
            }

            if (
              high > this.lastPeak.getValue(index - 1) &&
              high > lastThrough + this.change * lastThrough
            ) {
              this.lastPeak.setValue(index, high);
              this.ZIGZAGValue.setValue(index, high);
              this.ZIGZAGValue.setValue(lastThroughIndex, lastThrough);
              this.addValuesInBetween(lastThroughIndex, index, lastThrough, lastPeak);
              this.lastPeakIndex.setValue(index, index);
              this.lastExtremeType.setValue(index, 1);
            } else if (
              low < this.lastThrough.getValue(index - 1) &&
              low < lastPeak - this.change * lastPeak
            ) {
              this.lastThrough.setValue(index, low);
              this.ZIGZAGValue.setValue(index, low);
              this.ZIGZAGValue.setValue(lastPeakIndex, lastPeak);
              this.addValuesInBetween(lastPeakIndex, index, lastPeak, lastThrough);
              this.lastThroughIndex.setValue(index, index);
              this.lastExtremeType.setValue(index, -1);
            }
          }.bind(this);
        };

        this.calculate = function (this: any, index: any) {
          var lastExtremeType = this.lastExtremeType.getValue(index - 1);
          var high = this.HIGH.getValue(index);
          var low = this.LOW.getValue(index);

          if (high === null || low === null) {
            return;
          }

          if (lastExtremeType === 1) {
            this.calculateWhenLastWasPeak(index);
          } else if (lastExtremeType === -1) {
            this.calculateWhenLastWasThrough(index);
          } else {
            this.calculateWhenLastWasUnknown(index);
          }

          if (
            this.EXTENDTOLASTBAR &&
            index === this.HIGH.getSeriesLength() - 1 &&
            this.ZIGZAGValue.getValue(index) === null
          ) {
            if (lastExtremeType === 1) {
              var lastPeak = this.lastPeak.getValue(index - 1) || high;
              var lastPeakIndex = this.lastPeakIndex.getValue(index - 1) || 0;
              this.ZIGZAGValue.setValue(index, low);
              this.addValuesInBetween(lastPeakIndex, index, lastPeak, low);
            } else if (lastExtremeType === -1) {
              var lastThrough = this.lastThrough.getValue(index - 1) || low;
              var lastThroughIndex = this.lastThroughIndex.getValue(index - 1) || 0;
              this.ZIGZAGValue.setValue(index, high);
              this.addValuesInBetween(lastThroughIndex, index, lastThrough, high);
            }
          }
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
