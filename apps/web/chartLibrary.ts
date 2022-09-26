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
    availableIntervals: [
        { symbol: "1m" },
        { symbol: "5m", milis: 60000 },
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
