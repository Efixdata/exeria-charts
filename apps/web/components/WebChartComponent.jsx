import React, {useLayoutEffect, useState } from "react";
import {ChartUI} from '@dexer-io/react-chart-ui';
import Chart from "@dexer-io/chart";
import skyrocketData1h from "../data/BNBUSD.json";
import skyrocketData5m from "../data/BNBUSD-5m.json";

const getCandles = (candles) => {
  const result = [];
  
  for (let i=0; i < candles.t.length; ++i) {
    result.push({
        o: candles.o[i] * 0.000000001,
        h: candles.h[i] * 0.000000001,
        l: candles.l[i] * 0.000000001,
        c: candles.c[i] * 0.000000001,
        v: candles.v[i],
        stamp: candles.t[i]
    })
  }

  return result;
}

const instrument2 = {
  id: "BTC2USD",
  symbol: "BTC2/USD",
  name: "BTC2/USD",
  currency: "USD2",
  precision: 10,
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
      
      const chart = new Chart({
        container: containerElement,
        instrument: instrument
      });
  
      const candles = getCandles(skyrocketData1h);
  
      chart.init();
      chart.setMainSeriesData(candles, { symbol: "1h", milis: 2700000 });
  
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
      chart.setMainSeriesData(getCandles(skyrocketData5m), { symbol: "5m", milis: 60000 });
    } else {
      chart.setMainSeriesData(getCandles(skyrocketData1h), { symbol: "1h", milis: 2700000 });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ width: '1000px', height: '800px', backgroundColor: '#100c22' }}>
          <ChartUI chart={chart} onIntervalChange={onIntervalChange}>
            <div ref={objectRef} />
          </ChartUI>
          
        </div>
      </div>
    </div>
  );
}
