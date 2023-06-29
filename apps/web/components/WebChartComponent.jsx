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
      const timeRangeId = chart.toolDrawer.drawTimeBet({
        startTime: 1663027200000,
        timeRange: 50000000,
        price: 0.000028700,
        reward: 458,
        bet: 700,
        predictedDirection: 'DOWN',
        status: "ACTIVE",
        isWinning: false,
        config:  {
          editable: false,
          color: "#1C6897",
          winningColor: "#25AD98",
          losingColor: "#D12E59",
          secondaryColor: "#ffffff10",
          textColor: "white",
          priceTag: true
        }
      });

      // setTimeout(() => {
        
      //   chart.toolDrawer.deleteTool(futureTimeRangeId);
      // }, 1000)
  
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

  const swipperBlueLight = '#21C1F2';
  const swipperBlue = '#1EA1CD';
  const swipperWhite = '#fff';
  const swipperGreenLight = '#3CC3AF';

  const swipperTheme = {
    border: {
      inner: '1px solid rgba(255,255,255,0.1)',
      outter: '1px solid rgba(255,255,255,0.1)',
      radius: 6
    },
    gap: 8,
    accentColor: swipperGreenLight,
    buttons: {
      color: 'white',
      activeColor: 'white',
      activeBackground: 'transparent',
      hoverColor: 'white',
      hoverBackground: 'rgba(255, 255, 255, 0.1)',
    },
    radioButton: {
      background: 'rgba(255, 255, 255, 0.1)',
      buttons: {
        color: swipperBlue,
        activeColor: swipperGreenLight,
        hoverColor: swipperBlue,
        hoverBackground: 'rgba(255, 255, 255, 0.1)'
      },
    },
    toolbar: {
      background: '#113D59',
      buttons: {
        color: swipperBlueLight,
        activeColor: swipperGreenLight,
        hoverColor: swipperBlueLight,
        hoverBackground: 'rgba(255, 255, 255, 0.1)'
      } 
    },
    subMenu: {
      background: swipperBlue,
      buttons: {
        color: swipperWhite,
        activeColor: swipperWhite,
        activeBackground: swipperGreenLight,
        hoverColor: 'rgba(255, 255, 255, 0.1)',
        hoverBackground: 'rgba(255, 255, 255, 0.1)'
      }
    },
    splitButton: {
      openBackground: swipperBlue,
      hoverBackground: swipperBlue,
      openColor: swipperWhite,
      hoverColor: swipperWhite,
      arrowHoverBackground: 'rgba(255, 255, 255, 0.1)',
      arrowColor: swipperBlueLight,
      arrowOpenColor: swipperBlueLight
    },
    dialog: {
      backgroundColor: '#144869',
      titleColor: 'white',
      textColor: 'white',
      dividerColor: 'rgba(255, 255, 255, 0.1)',
      itemTitleColor: 'white',
      itemSubTitleColor: 'rgba(255, 255, 255, 0.7)',
      itemHoverBackgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    inputs: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
      placeholderColor: 'rgba(255, 255, 255, 0.5)',
      textColor: 'white',
    },
    scrollBar: {
      trackColor: 'rgba(255, 255, 255, 0.02)',
      thumbColor: 'rgba(255, 255, 255, 0.1)',
      thumbHoverColor: swipperGreenLight,
    },
  }

  return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#100c22'}}>
          <ChartUI chart={chart} onIntervalChange={onIntervalChange} theme={swipperTheme}>
            <div ref={objectRef} />
          </ChartUI>
        </div>
  );
}
