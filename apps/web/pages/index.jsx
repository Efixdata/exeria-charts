// import { Button } from "ui";
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
const ChartComponent = dynamic(() => import('@dexer-io/react-chart').then((mod) => mod.ChartComponent), {ssr: false})


export default function Web() {
  // const [instrument, setInstrument] = useState({
  //   id: "BTCUSD",
  //   symbol: "BTC/USD",
  //   name: "BTC/USD",
  //   currency: "USD",
  //   precision: 2,
  //   chart: "ohlc",
  //   availableIntervals: [{ symbol: "1m" }, { symbol: "5m" }, { symbol: "15m" }, { symbol: "1h" }, { symbol: "1D" }, { symbol: "1M" }],
  //   interval: { symbol: "1h" }
  // });
  // const [candles, setCandles] = useState(BTCUSD.candles);

  // instrument = {
  //   id: "BTCUSD",
  //   symbol: "BTC/USD",
  //   name: "BTC/USD",
  //   currency: "USD",
  //   precision: 2,
  //   chart: "ohlc",
  //   availableIntervals: [{ symbol: "1m" }, { symbol: "5m" }, { symbol: "15m" }, { symbol: "1h" }, { symbol: "1D" }, { symbol: "1M" }],
  //   interval: { symbol: "1h" }
  // };

  // candles = BTCUSD.candles;

  // let eurusd = {
  //   id: "EURUSD",
  //   symbol: "EUR/USD",
  //   name: "EUR/USD",
  //   currency: "USD",
  //   precision: 4,
  //   chart: "ohlc",
  //   availableIntervals: [{ symbol: "1m" }, { symbol: "5m" }, { symbol: "15m" }, { symbol: "1h" }, { symbol: "1D" }, { symbol: "1M" }],
  //   interval: { symbol: "1h" }
  // }

  // setTimeout(() => {
  //   setInstrument(eurusd);
  //   setCandles(data.candles);
  // }, 3000)

  return (
    <div>
      {/* <h1>Web</h1> */}
      {/* <Button /> */}
      
      <div style={{ display: "flex", gap: "10px" }}>
        {/* <div style={{ width: '374px', height: '460px' }}>
          <ChartComponent />
        </div> */}
        {/* <div style={{ width: '335px', height: '460px' }}>
          <ChartComponent />
        </div> */}
        {/* <div style={{ width: '1032px', height: '400px' }}>
          <ChartComponent />
        </div> */}
        <div style={{ width: '1256px', height: '400px' }}>
          <ChartComponent />
        </div>
      </div>
    </div>
);
}
