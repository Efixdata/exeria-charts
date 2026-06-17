# @efixdata/connector-kucoin

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides real-time and historical cryptocurrency price data from KuCoin public Spot API.

## Features

- Historical OHLC data from KuCoin REST API (`/api/v1/market/candles`)
- Real-time candle updates via KuCoin Classic WebSocket (`/market/candles`)
- Public token bootstrap (`/api/v1/bullet-public`) with ping/pong heartbeat
- Symbol helpers for `BTC-USDT` and compact `BTCUSDT` formats
- REST polling fallback for `5m` (not available on KuCoin WS kline channel)
- No API key required for public market data

## Installation

```bash
npm install @efixdata/connector-kucoin
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { KucoinAdapter } from "@efixdata/connector-kucoin";

const adapter = new KucoinAdapter();

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

## Configuration

```typescript
const adapter = new KucoinAdapter({
  baseUrl: "https://api.kucoin.com",
  requestTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,
  pageDelayMs: 300,
  pollingIntervalMs: 30000,
});
```

## Supported Symbols

Use KuCoin spot format (`BTC-USDT`, `ETH-USDT`). The adapter also accepts compact symbols like `BTCUSDT`.

## Supported Timeframes

`1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `8h`, `12h`, `1d`, `1w`

`1M` is not supported natively. Live WebSocket updates are unavailable for `5m`; the adapter polls ticker REST instead.

## API Reference

`KucoinAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Up to 1500 candles per REST request
- KuCoin returns `[time, open, close, high, low, volume, amount]` — mapped to standard OHLC internally
- Public API rate limits apply; use `pageDelayMs` when paginating history

## License

MIT
