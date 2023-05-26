import React, {useLayoutEffect, useState } from "react";
import {ChartUI} from '@dexer-io/react-chart-ui';
import Chart from "@dexer-io/chart";
import skyrocketData1h from "../data/BNBUSD.json";
import skyrocketData5m from "../data/BNBUSD-5m.json";

const getCandles = (candles, multiplier) => {
  const result = [];
  if (!multiplier) multiplier = 1;
  
  for (let i=0; i < candles.t.length; ++i) {
    result.push({
        o: candles.o[i] * multiplier,
        h: candles.h[i] * multiplier,
        l: candles.l[i] * multiplier,
        c: candles.c[i] * multiplier,
        v: candles.v[i],
        stamp: candles.t[i]
    })
  }

  return result;
}

const instrument = {
  id: "BTCUSD",
  symbol: "BTC/USD",
  name: "BTC/USD",
  currency: "USD",
  precision: 10,
  chart: "ohlc",
  availableIntervals: [
    { symbol: "1m", milis: 60000 },
    { symbol: "5m", milis:  300000},
    { symbol: "15m", milis: 900000 },
    { symbol: "1h", milis: 2700000 },
    { symbol: "1D", milis: 86400000 },
    { symbol: "1M", milis: -1 }],
  interval: { symbol: "1h", milis: 2700000 }
};

const instrument2 = {
  id: "BTC2USD",
  symbol: "BTC2/USD",
  name: "BTC2/USD",
  currency: "USD2",
  precision: 2,
  chart: "ohlc",
  availableIntervals: [
    { symbol: "1m", milis: 60000 },
    { symbol: "5m", milis:  300000},
    { symbol: "15m", milis: 900000 },
    { symbol: "1h", milis: 2700000 },
    { symbol: "1D", milis: 86400000 },
    { symbol: "1M", milis: -1 }],
  interval: { symbol: "5m", milis: 300000 }
  };

const getChartLibrary = (containerElement) => {      
      const chart = new Chart({
        container: containerElement,
        instrument: instrument
      });
  
      const candles = getCandles(skyrocketData1h, 0.0000001);
  
      chart.init();
      chart.setMainSeriesData(candles, { symbol: "1h", milis: 2700000 });
      const id = chart.drawTool({
        type: "timeRange",
        editable: false,
        color: "#14f7ab20",
        secondaryColor: "#ffffff10",
        text: "15m",
        textColor: "white",
        stamp1: 1663066800000,
        stamp2: 1661066800000
      });

      setTimeout(() => {
        chart.deleteTool(id);
      }, 10000)
  
      return chart;
  }


export function WebChartComponent() {
  let objectRef = React.createRef();
  const [chart, setChart] = useState(null);

  let width = "100%";
  let height = "100%";
  let maxHeight = "100%";
  let maxWidth = "100%";

  useLayoutEffect(() => {
      const containerElement = objectRef.current;

      // @ts-ignore
      containerElement.style.width = width;
      // @ts-ignore
      containerElement.style.height = height;
      // @ts-ignore
      containerElement.style.maxHeight = maxHeight;
      // @ts-ignore
      containerElement.style.maxWidth = maxWidth;
      // @ts-ignore
      containerElement.style.position = "relative";

      if (chart === null) setChart(getChartLibrary(containerElement));
  });

  const onIntervalChange = (symbol) => {
    if (symbol == "5m") {
      chart.setInstrument(instrument2);
      chart.setMainSeriesData(getCandles(skyrocketData5m), { symbol: "5m", milis: 300000 });
    } else {
      chart.setInstrument(instrument);
      chart.setMainSeriesData(getCandles(skyrocketData1h, 0.0000001), { symbol: "1h", milis: 2700000 });
    }
  };

  const theme = {
    background: "blue",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    accentColor: "green",
    icons: {
        color: "white",
        activeColor: "red",
        groupBackgroundColor: "purple",
        backgroundHoverColor: "rgba(255, 255, 255, 0.1)",
    },
    menu: {
        hoverBackgroundColor: "pink",
        splitButtonBackgroundColor: "black",
        activeBackgroundColor: "#888",
        activeBackgroundHoverColor: "rgba(255, 255, 255, 0.1)",
        textColor: "white",
        textActiveColor: "red"
    },
    dialog: {
        backgroundColor: "#333",
        titleColor: "white",
        textColor: "white",
        dividerColor: "rgba(255, 255, 255, 0.1)",
        itemTitleColor: "white",
        itemSubTitleColor: "rgba(255, 255, 255, 0.7)",
        itemHoverBackgroundColor: "rgba(255, 255, 255, 0.1)"
    },
    inputs: {
        backgroundColor: "black",
        placeholderColor: "grey",
        textColor: "white",
    },
    scrollBar: {
        trackColor: "rgba(255, 255, 255, 0.02)",
        thumbColor: "rgba(255, 255, 255, 0.1)",
        thumbHoverColor: "tomato",
  }
}

  return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#100c22' }}>
          <ChartUI chart={chart} onIntervalChange={onIntervalChange}>
            <div ref={objectRef} />
          </ChartUI>
        </div>
  );
}
