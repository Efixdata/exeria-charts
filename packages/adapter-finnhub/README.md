# @efixdata/connector-finnhub

Finnhub market data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts).

> **License: paid, source-available (EULA).** The source is published for evaluation and
> integration. **Production or commercial use requires a paid license** from Efix Data Sp. z o. o.
> See the package `LICENSE` and the repository `LICENSING.md`.

## Features

- US stocks (`AAPL`, `SPY`)
- Forex via OANDA symbols (`OANDA:EUR_USD`, or `EUR/USD`)
- Crypto via exchange prefix (`BINANCE:BTCUSDT`)
- REST candle history and `/quote` for stocks
- WebSocket trade stream (`wss://ws.finnhub.io`)

## Install

```bash
npm install @efixdata/exeria-chart @efixdata/connector-finnhub
```

## Usage

```ts
import { createChart } from "@efixdata/exeria-chart";
import { FinnhubAdapter } from "@efixdata/connector-finnhub";

const connector = new FinnhubAdapter({
  apiKey: process.env.FINNHUB_API_KEY!,
});

const chart = createChart({ container, dataAdapter: connector });
chart.init();

await chart.loadData("AAPL", { interval: "1d", limit: 500 });
chart.subscribeToUpdates("AAPL");
```

## Licensing

This adapter is paid, source-available software under an EULA. Market data is also subject to
[Finnhub pricing and terms](https://finnhub.io/pricing).
