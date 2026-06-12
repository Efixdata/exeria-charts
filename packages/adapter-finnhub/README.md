# @efix-data/adapter-finnhub

Finnhub market data adapter for [@efixdata/exeria-chart](https://github.com/efixdata/chart-repo).

## Features

- US stocks (`AAPL`, `SPY`)
- Forex via OANDA symbols (`OANDA:EUR_USD`, or `EUR/USD`)
- Crypto via exchange prefix (`BINANCE:BTCUSDT`)
- REST candle history and `/quote` for stocks
- WebSocket trade stream (`wss://ws.finnhub.io`)

## Install

```bash
npm install @exeria/charts @efix-data/adapter-finnhub
```

## Usage

```ts
import { createChart } from "@exeria/charts";
import { FinnhubAdapter } from "@efix-data/adapter-finnhub";

const connector = new FinnhubAdapter({
  apiKey: process.env.FINNHUB_API_KEY!,
});

const chart = createChart({ container, dataAdapter: connector });
chart.init();

await chart.loadData("AAPL", { interval: "1d", limit: 500 });
chart.subscribeToUpdates("AAPL");
```

## License

MIT
