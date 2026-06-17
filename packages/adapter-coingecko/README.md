# @efixdata/connector-coingecko

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides historical cryptocurrency market data from CoinGecko REST API, with near-real-time updates via HTTP polling.

## Features

- Historical OHLC data from CoinGecko REST API (`/coins/{id}/ohlc`)
- Date-range history via `/coins/{id}/market_chart/range`
- Near-real-time price updates via polling `/simple/price` (default: every 60 seconds)
- CoinGecko coin id symbols (`bitcoin`, `ethereum`, …)
- Optional Pro API key support
- Exeria interval mapping (`1d`, `1h`, `1w`, …)

## Installation

```bash
npm install @efixdata/connector-coingecko
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { CoingeckoAdapter } from "@efixdata/connector-coingecko";

const adapter = new CoingeckoAdapter();

const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

await chart.loadData("bitcoin", {
  interval: "1d",
  limit: 90,
});

chart.subscribeToUpdates("bitcoin");
```

## Configuration

```typescript
const adapter = new CoingeckoAdapter({
  baseUrl: "https://api.coingecko.com/api/v3",
  apiKey: process.env.COINGECKO_API_KEY,
  vsCurrency: "usd",
  pollIntervalMs: 60_000,
  requestTimeout: 5000,
  maxRetries: 3,
  retryDelay: 1000,
});
```

## Supported Symbols

CoinGecko **coin ids**, not exchange pairs:

- `bitcoin` (not `BTCUSDT`)
- `ethereum`
- `solana`

Look up ids via [CoinGecko API docs](https://www.coingecko.com/en/api/documentation).

## Supported Timeframes

Best supported on the Demo API:

- `1d` — daily-style bars via OHLC (`days=90`)
- `1h` — hourly on paid plans; Demo falls back to ~4h granularity via `days=7`
- `1w` — weekly resampling is not built-in; use `1d` with a longer `days` range

Sub-minute intervals are not exchange-grade on CoinGecko. Use [Binance](https://github.com/Efixdata/exeria-charts/tree/main/packages/adapter-binance) for live tick data.

## API Reference

`CoingeckoAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Limits

- Demo API: 100 requests/minute, 10,000 requests/month
- `/ohlc` does not include volume (volume is `0`; use `market_chart/range` for volume)
- Public API historical range is limited to the past 365 days
- Polling default is 60 seconds — do not lower aggressively in production

## License

MIT
