# @efixdata/connector-gate

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides real-time and historical cryptocurrency price data from Gate.io public Spot API v4.

## Features

- Historical OHLC data from Gate.io REST API (`/api/v4/spot/candlesticks`)
- Real-time candle updates via Gate.io WebSocket (`spot.candlesticks`)
- Symbol normalization (`BTCUSDT` → `BTC_USDT`)
- No API key required for public spot market data

## Installation

```bash
npm install @efixdata/exeria-chart @efixdata/connector-gate
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { GateAdapter } from "@efixdata/connector-gate";

const adapter = new GateAdapter();

const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

await chart.loadData("BTC_USDT", {
  interval: "1h",
  limit: 500,
});

chart.subscribeToUpdates("BTC_USDT");
```

Compact symbols are also accepted and normalized automatically:

```typescript
await chart.loadData("BTCUSDT", { interval: "1d", limit: 300 });
```

## Supported Symbols

Gate.io spot pairs use `BASE_QUOTE` format, e.g. `BTC_USDT`, `ETH_USDT`, `SOL_USDT`.
The adapter also accepts compact symbols like `BTCUSDT`.

## API Reference

`GateAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## License

MIT
