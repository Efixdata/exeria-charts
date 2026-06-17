# @efixdata/connector-coinbase

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides real-time and historical cryptocurrency price data from the Coinbase Advanced Trade public API.

## Features

- Historical OHLCV from Coinbase REST (`/api/v3/brokerage/market/products/{id}/candles`)
- Live price updates via WebSocket `ticker_batch` + `heartbeats`
- REST polling fallback (`useWebSocket: false`)
- Symbol helpers for `BTC-USD` and compact `BTCUSD` formats
- No API key required for public market data

## Installation

```bash
npm install @efixdata/connector-coinbase
```

## Quick Start

```typescript
import { createChart } from "@efixdata/exeria-chart";
import { CoinbaseAdapter } from "@efixdata/connector-coinbase";

const adapter = new CoinbaseAdapter();

const chart = createChart({ container, dataAdapter: adapter });
chart.init();

await chart.loadData("BTC-USD", {
  interval: "1d",
  limit: 500,
});

chart.subscribeToUpdates("BTC-USD");
```

## Configuration

```typescript
const adapter = new CoinbaseAdapter({
  baseUrl: "https://api.coinbase.com",
  wsUrl: "wss://advanced-trade-ws.coinbase.com",
  requestTimeout: 10000,
  maxRetries: 3,
  retryDelay: 1000,
  pageDelayMs: 300,
  pollingIntervalMs: 5000,
  useWebSocket: true,
});
```

## Supported Symbols

Use Coinbase product ids (`BTC-USD`, `ETH-USDC`). The adapter also accepts `BTCUSD`, `BTC/USD`, and bare bases like `SOL` (defaults to `-USD`).

## Supported Timeframes

`1m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `1d`

`3m`, `8h`, `12h`, `1w`, and `1M` are not supported natively by Coinbase and throw a clear error.

## API Reference

`CoinbaseAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Up to 350 candles per REST request (paginated automatically)
- Coinbase candle `start` timestamps are in seconds
- Public API rate limits apply; use `pageDelayMs` when paginating history

## License

MIT
