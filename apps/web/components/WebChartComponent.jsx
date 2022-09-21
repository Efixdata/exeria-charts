import React, {useLayoutEffect, useState } from "react";
import {ChartUI} from '@dexer-io/react-chart-ui';
import Chart from "@dexer-io/chart";
import skyrocketData from "../data/BNBUSD.json";

const getChartLibrary = (containerElement) => {
  const instrument = {
      id: "BTCUSD",
      symbol: "BTC/USD",
      name: "BTC/USD",
      currency: "USD",
      precision: 2,
      chart: "ohlc",
      availableIntervals: [{ symbol: "1m" }, { symbol: "5m" }, { symbol: "15m" }, { symbol: "1h" }, { symbol: "1D" }, { symbol: "1M" }],
      interval: { symbol: "1h" }
      };
      
      const chart = new Chart({
        container: containerElement,
        instrument: instrument
      });
  
      const candles = [];
  
      for (let i=0; i < skyrocketData.t.length; ++i) {
      candles.push({
          o: skyrocketData.o[i],
          h: skyrocketData.h[i],
          l: skyrocketData.l[i],
          c: skyrocketData.c[i],
          v: skyrocketData.v[i],
          stamp: skyrocketData.t[i]
      })
      }
  
      chart.init();
      chart.setMainSeriesData(candles);
  
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

  return (
    <div>
      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ width: '800px', height: '600px', backgroundColor: '#100c22' }}>
          <ChartUI chart={chart}>
            <div ref={objectRef} />
          </ChartUI>
          
        </div>
      </div>
    </div>
  );
}
