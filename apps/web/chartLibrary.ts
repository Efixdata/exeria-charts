import dynamic from 'next/dynamic';
// const Chart = dynamic(() => import('@dexer-io/chart').then((mod) => mod.Chart), {ssr: false});
// import Chart from "@dexer-io/chart";
import skyrocketData from "./data/BNBUSD.json";

const getChartLibrary = (containerElement: any) => {
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

export default getChartLibrary;
