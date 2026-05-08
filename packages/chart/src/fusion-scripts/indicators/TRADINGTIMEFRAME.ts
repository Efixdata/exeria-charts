import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createTRADINGTIMEFRAMEIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "ttfTitle",
    description: "ttfDescription",
    type: "indicators",
    newPane: true,
    quickAdd: false,
    inputs: {
      DAYS: {
        type: "booleanList",
        name: "ttfDays",
        properties: {},
        value: {
          1: { name: "Monday", value: true },
          2: { name: "Tuesday", value: true },
          3: { name: "Wednesday", value: true },
          4: { name: "Thursday", value: true },
          5: { name: "Friday", value: true },
          6: { name: "Saturday", value: false },
          0: { name: "Sunday", value: false },
        },
      },

      START_TIME: {
        type: "list",
        name: "hourFrom",
        properties: {},
        list: [
          "00:00",
          "00:30",
          "01:00",
          "01:30",
          "02:00",
          "02:30",
          "03:00",
          "03:30",
          "04:00",
          "04:30",
          "05:00",
          "05:30",
          "06:00",
          "06:30",
          "07:00",
          "07:30",
          "08:00",
          "08:30",
          "09:00",
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
          "20:00",
          "20:30",
          "21:00",
          "21:30",
          "22:00",
          "22:30",
          "23:00",
          "23:30",
        ],
        value: "08:00",
      },
      STOP_TIME: {
        type: "list",
        name: "hourTo",
        properties: {},
        list: [
          "00:00",
          "00:30",
          "01:00",
          "01:30",
          "02:00",
          "02:30",
          "03:00",
          "03:30",
          "04:00",
          "04:30",
          "05:00",
          "05:30",
          "06:00",
          "06:30",
          "07:00",
          "07:30",
          "08:00",
          "08:30",
          "09:00",
          "09:30",
          "10:00",
          "10:30",
          "11:00",
          "11:30",
          "12:00",
          "12:30",
          "13:00",
          "13:30",
          "14:00",
          "14:30",
          "15:00",
          "15:30",
          "16:00",
          "16:30",
          "17:00",
          "17:30",
          "18:00",
          "18:30",
          "19:00",
          "19:30",
          "20:00",
          "20:30",
          "21:00",
          "21:30",
          "22:00",
          "22:30",
          "23:00",
          "23:30",
        ],
        value: "20:00",
      },
      TIMEZONE_OFFSET: {
        type: "timezone",
        name: "timezone",
        properties: {},
        list: [
          { name: "UTC-12:00", offset: 720 },
          { name: "UTC-11:00", offset: 660 },
          { name: "UTC-10:00", offset: 600 },
          { name: "UTC-9:00", offset: 540 },
          { name: "UTC-8:00", offset: 480 },
          { name: "UTC-7:00", offset: 420 },
          { name: "UTC-6:00", offset: 360 },
          { name: "UTC-5:00", offset: 300 },
          { name: "UTC-4:00", offset: 240 },
          { name: "UTC-3:00", offset: 180 },
          { name: "UTC-2:00", offset: 120 },
          { name: "UTC-1:00", offset: 60 },
          { name: "UTC-0:00", offset: 0 },
          { name: "UTC+1:00", offset: -60 },
          { name: "UTC+2:00", offset: -120 },
          { name: "UTC+3:00", offset: -180 },
          { name: "UTC+4:00", offset: -240 },
          { name: "UTC+5:00", offset: -300 },
          { name: "UTC+6:00", offset: -360 },
          { name: "UTC+7:00", offset: -420 },
          { name: "UTC+8:00", offset: -480 },
          { name: "UTC+9:00", offset: -540 },
          { name: "UTC+10:00", offset: -600 },
          { name: "UTC+11:00", offset: -660 },
          { name: "UTC+12:00", offset: -720 },
          { name: "UTC+13:00", offset: -780 },
          { name: "UTC+14:00", offset: -840 },
        ],
      },
    },
    outputs: {
      TRADINGTIMEFRAME: {
        type: "series",
        series: {
          seriesId: null,
          title: "ttfTitle",
          labels: ["value"],
          fields: ["TTFValue"],
          data: null,
        },
      },
    },
    plotters: [
      {
        type: "SeriesObject",
        dataLink: "TRADINGTIMEFRAME",
        renderAs: "Line",
        dataField: "TTFValue",
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
      var TradingTimeFrameController: FusionScriptControllerConstructor = function (
        this: FusionScriptControllerRuntime,
        context: CoreFusionRuntime,
        inputs: Record<string, any>,
        outputs: Record<string, any>
      ) {
        this.id = "";
        this.context = context;
        this.inputs = inputs;
        this.outputs = outputs;

        this.hourToMinutes = function (this: any, h: any) {
          var hour = h.split(":");
          var minutes = parseInt(hour[0]) * 60 + parseInt(hour[1]);
          return minutes;
        };

        this.timeToMinutes = function (this: any, date: any) {
          return date.getUTCMinutes() + 60 * date.getUTCHours();
        };

        this.init = function (this: any) {
          this.timeFrame = [];
          var start = this.hourToMinutes(this.inputs.START_TIME);
          var stop = this.hourToMinutes(this.inputs.STOP_TIME);

          if (start > stop) {
            this.timeFrame.push(
              [start, this.hourToMinutes("23:59")],
              [this.hourToMinutes("00:00"), stop]
            );
          } else {
            this.timeFrame.push([start, stop]);
          }
        };

        this.onModify = function (this: any) {
          this.init();
        };

        this.calculate = function (this: any, index: any) {
          this.TTFValue.setValue(index, 0);

          var timeLong = this.TTFValue.getStamp(index) - 60000 * this.inputs.TIMEZONE_OFFSET;
          var date = new Date(timeLong);
          var dayOfWeek = date.getUTCDay();

          if (this.inputs.DAYS[dayOfWeek]) {
            var stampMinutes = this.timeToMinutes(date);
            for (var i in this.timeFrame) {
              var timeFrame = this.timeFrame[i];
              if (stampMinutes >= timeFrame[0] && stampMinutes <= timeFrame[1]) {
                this.TTFValue.setValue(index, 1);
              }
            }
          }
        };
      };
      return new TradingTimeFrameController(context, inputs, outputs);
    },
  };
}
