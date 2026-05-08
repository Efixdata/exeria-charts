import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

type FusionRecord = Record<string, any>;

export default function createPIVOTPOINTSIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "pivotPointTitle",
    description: "pivotPointDescription",
    type: "indicators",
    newPane: false,
    quickAdd: false,
    inputs: {
      CLOSE: { type: "series", name: "price", properties: { def: "c" }, value: null },
    },
    outputs: {
      PIVOTPOINTS: {
        type: "series",
        series: {
          seriesId: null,
          title: "pivotPointTitle",
          labels: [
            "pivotPointResistance3",
            "pivotPointResistance2",
            "pivotPointResistance1",
            "pivotPointTitle",
            "pivotPointSupport1",
            "pivotPointSupport2",
            "pivotPointSupport3",
          ],
          fields: [
            "Resistance3",
            "Resistance2",
            "Resistance1",
            "PivotPoint",
            "Support1",
            "Support2",
            "Support3",
          ],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "PivotPoint",
        color: "#03a9f4",
        width: 1.5,
        dash: [],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Support1",
        color: "#4caf50",
        width: 1.5,
        dash: [3, 3],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Support2",
        color: "#4caf50",
        width: 1.5,
        dash: [1, 4],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Support3",
        color: "#4caf50",
        width: 1.5,
        dash: [1, 8],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Resistance1",
        color: "#f44336",
        width: 1.5,
        dash: [3, 3],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Resistance2",
        color: "#f44336",
        width: 1.5,
        dash: [1, 4],
      },
      {
        type: "SeriesObject",
        dataLink: "PIVOTPOINTS",
        renderAs: "Line",
        dataField: "Resistance3",
        color: "#f44336",
        width: 1.5,
        dash: [1, 8],
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

        this.init = function (this: any) {
          var getInterval = function (interval: FusionRecord, availableIntervals: FusionRecord[]) {
            var pivotInterval = {};
            if (interval.symbol === "1m" || interval.symbol === "5m" || interval.symbol === "15m") {
              pivotInterval = {
                desc: "1D",
                id: 5,
                milis: 86400000,
                symbol: "1D",
              };
            } else if (
              interval.symbol === "1D" ||
              interval.symbol === "1W" ||
              interval.symbol === "1M"
            ) {
              pivotInterval = {
                desc: "1M",
                id: 7,
                milis: 2592000000,
                symbol: "1M",
              };
            } else {
              pivotInterval = {
                desc: "1W",
                id: 6,
                milis: 604800000,
                symbol: "1W",
              };
            }
            return FUSION.lib.getBestMatchingInterval(pivotInterval, availableIntervals);
          };

          return new Promise(
            function (this: any, resolve: any, reject: any) {
              var instrument = this.CLOSE.getInstrument();
              var interval = this.CLOSE.getInterval();

              if (this.data && instrument === this.instrument && interval === this.interval) {
                resolve();
                return;
              }

              this.instrument = instrument;
              this.interval = interval;

              FUSION.lib.loadInstrumentCandles(
                instrument,
                getInterval(interval, instrument.availableIntervals),
                function (this: any, data: FusionRecord) {
                  this.data = data.candles;
                  resolve();
                }.bind(this),
                reject
              );
            }.bind(this)
          );
        };

        this.onModify = async function () {
          await this.init();
        };

        this.getCandle = function (this: any, index: any) {
          var stamp = this.CLOSE.getStamp(index);

          for (var i = this.data.length - 1; i > 0; --i) {
            if (this.data[i].stamp <= stamp) {
              return this.data[i - 1];
            }
          }

          return {};
        };

        this.calculate = function (this: any, index: any) {
          if (!this.data || this.data.length === 0) return;

          var candle = this.getCandle(index);
          var high = candle.h;
          var low = candle.l;
          var close = candle.c;

          if (!high || !low || !close) {
            return;
          }

          var pivotPoint = (high + low + close) / 3;
          var candleHeight = high - low;

          this.PivotPoint.setValue(index, pivotPoint);
          this.Support1.setValue(index, 2 * pivotPoint - high);
          this.Support2.setValue(index, pivotPoint - candleHeight);
          this.Support3.setValue(index, low - 2 * (high - pivotPoint));
          this.Resistance1.setValue(index, 2 * pivotPoint - low);
          this.Resistance2.setValue(index, pivotPoint + candleHeight);
          this.Resistance3.setValue(index, high + 2 * (pivotPoint - low));
        };
      };

      return new Controller(context, inputs, outputs);
    },
  };
}
