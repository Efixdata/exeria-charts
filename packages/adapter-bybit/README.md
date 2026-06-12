# @efix-data/adapter-bybit

A data adapter for [@efixdata/exeria-chart](https://github.com/efixdata/chart-repo) that provides real-time and historical cryptocurrency price data from Bybit public market data (v5 API).

## Features

- Historical OHLC data from Bybit REST API (`/v5/market/kline`)
- Real-time candle updates via Bybit WebSocket (`kline.{interval}.{symbol}`)
- Automatic WebSocket reconnection and heartbeat pings
- Support for multiple cryptocurrency pairs (spot)
- No API key required for public market data
- Exeria interval mapping (`1h`, `1d`, `1w`, `1M`, …)

## Installation

```bash
npm install @efix-data/adapter-bybit
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { BybitAdapter } from "@efix-data/adapter-bybit";

const adapter = new BybitAdapter();

const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

await chart.loadData("BTCUSDT", {
  interval: "1d",
  limit: 1000,
});

chart.subscribeToUpdates("BTCUSDT");
```

## Configuration

```typescript
const adapter = new BybitAdapter({
  baseUrl: "https://api.bybit.com",
  wsUrl: "wss://stream.bybit.com/v5/public/spot",
  category: "spot",
  requestTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,
  pingIntervalMs: 20000,
});
```

## Supported Symbols

Any spot trading pair available on Bybit, e.g. `BTCUSDT`, `ETHUSDT`, `SOLUSDT`.

## Supported Timeframes

`1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `12h`, `1d`, `1w`, `1M`

## API Reference

`BybitAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Up to 1,000 candles per REST request
- Public API rate limits apply (see Bybit docs)
- WebSocket heartbeat ping is sent every 20 seconds by default

## License

MIT
