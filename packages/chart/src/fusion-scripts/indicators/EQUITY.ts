import type { CoreFusionRuntime, CoreFusionStatic } from "../../internal-types/fusion";
import type {
  FusionScriptControllerConstructor,
  FusionScriptControllerRuntime,
} from "../../internal-types/scripts";

export default function createEQUITYIndicatorScript(FUSION: CoreFusionStatic) {
  return {
    title: "equityTitle",
    description: "equityDescription",
    type: "indicators",
    showAsType: "strategies",
    newPane: true,
    quickAdd: false,
    inputs: {
      PRICE: { type: "series", name: "price", properties: { def: "c" }, value: null },
      STRATEGY: { type: "series", name: "equityStrategy", properties: {}, value: null },
      SPREAD: { type: "double", name: "spread", properties: { step: 0.0001 }, value: 0.0 },
      COMMISION: { type: "double", name: "commision", properties: { step: 0.01 }, value: 0.0 },
      INITEQ: { type: "double", name: "initialEquity", properties: { step: 1 }, value: 100000 },
      LOTSIZE: { type: "double", name: "lotSize", properties: { step: 1000 }, value: 100000 },
      CAPITAL: { type: "boolean", name: "equityCapital", properties: {}, value: false },
      PERC: { type: "boolean", name: "equityPerc", properties: {}, value: false },
    },

    outputs: {
      EQUITY: {
        type: "series",
        series: {
          seriesId: null,
          title: "equityTitle",
          labels: ["equityLine", "equityPL", "position", "commision", "spread"],
          fields: ["EQUITY", "EQUITY_HIST", "POSITION_SIZE", "COMMISION_SERIES", "SPREAD_SERIES"],
          data: null,
        },
      },
    },

    plotters: [
      {
        type: "SeriesObject",
        dataLink: "EQUITY",
        renderAs: "Line and Histogram",
        dataField: "EQUITY_HIST",
        color: "#ff9933",
        width: 1,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
      {
        type: "SeriesObject",
        dataLink: "EQUITY",
        renderAs: "Line",
        dataField: "EQUITY",
        color: "#2d566d",
        width: 2,
        dash: [],
        priceTag: false,
        priceLine: false,
      },
    ],

    controller: function (
      context: CoreFusionRuntime,
      inputs: Record<string, unknown>,
      outputs: Record<string, string>
    ) {
      var EQUITYController: FusionScriptControllerConstructor = function (
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
          this.PSMax = 0.0;
          this.PSMaxPrice = 0.0;
        };

        this.calculate = function (this: any, INDEX: any) {
          if (!this.PRICE.getValue(INDEX)) return;

          this.EQUITY.setValue(INDEX, 0);
          this.EQUITY_HIST.setValue(INDEX, 0);
          this.POSITION_SIZE.setValue(INDEX, 0);
          this.COMMISION_SERIES.setValue(INDEX, 0);
          this.SPREAD_SERIES.setValue(INDEX, 0);

          var valuePrev = 0;
          var strengthPrev = 0;
          var signal = 0;
          var strength = 0;
          var mult = 0;

          if (INDEX == 0) {
            this.PSMax = 0;
            this.PSMaxPrice = 0;
            if (this.CAPITAL === true) {
              this.EQUITY.setValue(INDEX, this.INITEQ);
              this.EQUITY_HIST.setValue(INDEX, this.INITEQ);
            }
          }

          if (INDEX > 0) {
            strengthPrev = this.POSITION_SIZE.getStrength(INDEX - 1);
            valuePrev = this.POSITION_SIZE.getValue(INDEX - 1);
          }
          this.POSITION_SIZE.setValue(INDEX, valuePrev);
          this.POSITION_SIZE.setStrength(INDEX, strengthPrev);

          if (this.STRATEGY.getValue(INDEX) === null) return;

          var signal = Math.round(this.STRATEGY.getValue(INDEX));
          strength = this.STRATEGY.getStrength(INDEX);
          var mult = 1.0;
          var WEIGHT = 1.0;

          if (signal == 0) {
            this.POSITION_SIZE.setValue(INDEX, strengthPrev);
            this.POSITION_SIZE.setStrength(INDEX, strengthPrev);
          } else if (signal == FUSION.BUY) {
            this.POSITION_SIZE.setValue(INDEX, strengthPrev + strength * mult * WEIGHT);
            this.POSITION_SIZE.setStrength(INDEX, strengthPrev + strength * mult * WEIGHT);
          } else if (signal == FUSION.SELL) {
            this.POSITION_SIZE.setValue(INDEX, strengthPrev - strength * mult * WEIGHT);
            this.POSITION_SIZE.setStrength(INDEX, strengthPrev - strength * mult * WEIGHT);
          } else if (signal == FUSION.EXIT_LONG) {
            if (strengthPrev > 0) {
              this.POSITION_SIZE.setValue(INDEX, 0);
              this.POSITION_SIZE.setStrength(INDEX, 0);
            }
          } else if (signal == FUSION.EXIT_SHORT) {
            if (strengthPrev < 0) {
              this.POSITION_SIZE.setValue(INDEX, 0);
              this.POSITION_SIZE.setStrength(INDEX, 0);
            }
          } else if (signal == FUSION.EXIT_ALL) {
            this.POSITION_SIZE.setValue(INDEX, 0);
            this.POSITION_SIZE.setStrength(INDEX, 0);
          } else {
            this.POSITION_SIZE.setValue(INDEX, strengthPrev);
            this.POSITION_SIZE.setStrength(INDEX, strengthPrev);
          }

          //LICZ equity line
          var position = 0;
          var positionPrev = 0;
          var equityPrev = 0;
          var pricePrev = 0;

          if (INDEX > 0) {
            positionPrev = this.POSITION_SIZE.getValue(INDEX - 1);
            equityPrev = this.EQUITY.getValue(INDEX - 1);
            pricePrev = this.PRICE.getValue(INDEX - 1);

            if (Math.abs(positionPrev) > this.PSMax) {
              this.PSMax = Math.abs(positionPrev);
              this.PSMaxPrice = pricePrev;
            }
          }
          position = this.POSITION_SIZE.getValue(INDEX);
          var price = this.PRICE.getValue(INDEX);
          if (price === null) return;

          var dPosition = position - positionPrev;
          var dEquity = positionPrev * (price - pricePrev);

          var spread_value = 0.0;
          var commision_value = 0.0;

          if (Math.abs(dPosition) > 0.0) {
            commision_value = Math.abs((dPosition * price * this.COMMISION) / 100);

            if (Math.abs(dPosition) > Math.abs(position)) {
              spread_value = Math.abs(position * this.SPREAD);
            } else {
              if (positionPrev <= 0.0 && position < 0.0 && position < positionPrev) {
                //inclease short
                spread_value = Math.abs(dPosition * this.SPREAD);
              } else if (positionPrev >= 0.0 && position > 0.0 && position > positionPrev) {
                //incerease long
                spread_value = Math.abs(dPosition * this.SPREAD);
              }
            }
          }

          this.COMMISION_SERIES.setValue(INDEX, commision_value);
          this.SPREAD_SERIES.setValue(INDEX, spread_value);

          dEquity = dEquity - commision_value;
          dEquity = dEquity - spread_value;

          if (this.CAPITAL === true) {
            if (INDEX == 0) {
              this.EQUITY.setValue(INDEX, this.INITEQ);
              this.EQUITY_HIST.setValue(INDEX, this.INITEQ);
            } else {
              this.EQUITY.setValue(INDEX, equityPrev + dEquity * this.LOTSIZE);
              this.EQUITY_HIST.setValue(INDEX, dEquity * this.LOTSIZE);
            }
          } else if (this.PERC === true) {
            if (this.PSMax > 0) {
              this.EQUITY.setValue(
                INDEX,
                equityPrev + (dEquity * 100) / (this.PSMax * this.PSMaxPrice)
              );
              this.EQUITY_HIST.setValue(INDEX, (dEquity * 100) / (this.PSMax * this.PSMaxPrice));
            }
          } else {
            this.EQUITY.setValue(INDEX, equityPrev + dEquity);
            this.EQUITY_HIST.setValue(INDEX, dEquity);
          }

          if (FUSION.DEBUG)
            console.log(
              "Index;" + INDEX + " ;C;" + this.PRICE.getValue(INDEX),
              " ;Eq;" +
                this.EQUITY.getValue(INDEX) +
                " ;DEq;" +
                this.EQUITY_HIST.getValue(INDEX) +
                " ;PS;" +
                this.POSITION_SIZE.getValue(INDEX) +
                " ;PSMax;" +
                this.PSMax
            );
        };
      };

      return new EQUITYController(context, inputs, outputs);
    },
  };
}
