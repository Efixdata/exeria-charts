# @efix-data/adapter-okx

A data adapter for [@efixdata/exeria-chart](https://github.com/efixdata/chart-repo) that provides real-time and historical cryptocurrency price data from OKX public market data (API v5).

## Features

- Historical OHLC data from OKX REST API (`/api/v5/market/candles`)
- Automatic pagination for requests above 300 candles
- Real-time candle updates via OKX business WebSocket (`candle1H`, `candle1D`, …)
- Symbol normalization (`BTCUSDT` → `BTC-USDT`)
- No API key required for public spot market data

## Installation

```bash
npm install @efix-data/adapter-okx
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { OkxAdapter } from "@efix-data/adapter-okx";

const adapter = new OkxAdapter();

const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

await chart.loadData("BTC-USDT", {
  interval: "1d",
  limit: 500,
});

chart.subscribeToUpdates("BTC-USDT");
```

Compact symbols are also accepted:

```typescript
await chart.loadData("BTCUSDT", { interval: "1h", limit: 300 });
```

## Configuration

```typescript
const adapter = new OkxAdapter({
  baseUrl: "https://www.okx.com",
  wsUrl: "wss://ws.okx.com:8443/ws/v5/business",
  requestTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,
  pageDelayMs: 120,
});
```

## Supported Symbols

OKX spot instruments use `BASE-QUOTE` format, e.g. `BTC-USDT`, `ETH-USDT`, `SOL-USDT`.

The adapter also accepts compact symbols like `BTCUSDT` and normalizes them automatically.

## Supported Timeframes

`1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `1w`, `1M`

## API Reference

`OkxAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Up to **300 candles per REST request** (adapter paginates automatically)
- Public API rate limits apply (see OKX docs)
- WebSocket candle channel uses the `/ws/v5/business` endpoint
- Browser WebSocket stacks handle protocol-level ping/pong automatically

## License

MIT
