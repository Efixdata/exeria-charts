# @efixdata/connector-kraken

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides real-time and historical cryptocurrency price data from Kraken public Spot API.

## Features

- Historical OHLC data from Kraken REST API (`/0/public/OHLC`)
- Real-time candle updates via Kraken WebSocket v2 (`ohlc` channel)
- Heartbeat subscription and reconnect deadline handling
- Symbol helpers for REST (`XBTUSD`) and WebSocket v2 (`BTC/USD`) formats
- No API key required for public market data
- Exeria interval mapping (`1h`, `1d`, `1w`, `1M`, …)

## Installation

```bash
npm install @efixdata/connector-kraken
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { KrakenAdapter } from "@efixdata/connector-kraken";

const adapter = new KrakenAdapter();

const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

await chart.loadData("BTC/USD", {
  interval: "1d",
  limit: 500,
});

chart.subscribeToUpdates("BTC/USD");
```

## Configuration

```typescript
const adapter = new KrakenAdapter({
  baseUrl: "https://api.kraken.com",
  wsUrl: "wss://ws.kraken.com/v2",
  requestTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,
  pageDelayMs: 1000,
  heartbeatDeadlineMs: 5000,
});
```

## Supported Symbols

Use WebSocket v2 format in your app (`BTC/USD`, `ETH/USD`). The adapter also accepts compact forms like `BTCUSD`, `XBTUSD`, and `BTC-USD`.

## Supported Timeframes

`1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`, `1M`

Kraken does not support `2h`, `3m`, `6h`, or `12h` natively.

## API Reference

`KrakenAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Up to 720 candles per REST request
- Public OHLC rate limit: ~1 request/second per IP and pair
- WebSocket v2 uses `BTC` (not `XBT`) in pair symbols
- `1M` maps to Kraken `21600` minutes (~15 days), not a calendar month

## License

MIT
