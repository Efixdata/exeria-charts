# @efixdata/connector-twelve-data

Market data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) powered by [Twelve Data](https://twelvedata.com/) — forex, stocks, crypto, and ETFs through one API.

> **License: paid, source-available (EULA).** The source is published for evaluation and
> integration. **Production or commercial use requires a paid license** from Efix Data Sp. z o. o.
> See the package `LICENSE` and the repository `LICENSING.md`.

## Features

- Historical OHLCV via Twelve Data `/time_series`
- Live price updates via WebSocket (`/v1/quotes/price`)
- Symbol normalization (`EURUSD`, `EUR-USD`, `EUR/USD`)
- Interval mapping from Exeria (`1m`, `1h`, `1d`, …) to Twelve Data (`1min`, `1h`, `1day`, …)

## Requirements

- **API key** from [Twelve Data](https://twelvedata.com/) (required)
- Node.js 18+ with `fetch` (and WebSocket for live updates)

## Installation

```bash
npm install @efixdata/connector-twelve-data
```

## Quick start

```typescript
import { createChart } from "@efixdata/exeria-chart";
import { TwelveDataAdapter } from "@efixdata/connector-twelve-data";

const connector = new TwelveDataAdapter({
  apiKey: process.env.TWELVE_DATA_API_KEY!,
});

const chart = createChart({
  container: "#chart",
  dataAdapter: connector,
});

chart.init();

await chart.loadData("EUR/USD", {
  interval: "1h",
  limit: 500,
});

chart.subscribeToUpdates("EUR/USD", (tick) => {
  console.log(tick.price ?? tick.c);
});
```

## Configuration

```typescript
const connector = new TwelveDataAdapter({
  apiKey: process.env.TWELVE_DATA_API_KEY!,
  baseUrl: "https://api.twelvedata.com",
  wsUrl: "wss://ws.twelvedata.com/v1/quotes/price",
  requestTimeout: 10000,
  maxRetries: 3,
  onError: (error) => console.error(error),
});
```

## Licensing

Twelve Data free tiers are for **development and personal use**. Public display or redistribution in customer-facing products requires a paid plan and may require attribution. See [Twelve Data pricing](https://twelvedata.com/pricing) and [attribution guidelines](https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data).

Do **not** embed your API key in browser bundles — run this adapter on your server or behind a proxy.

## When to use Twelve Data vs crypto connectors

| Use Twelve Data | Use Binance / Bybit / Kraken |
| --- | --- |
| Forex majors (`EUR/USD`, `GBP/USD`) | Public crypto spot, no API key |
| US stocks (`AAPL`) in the same vendor | Native WebSocket, smallest bundle |
| Multi-asset fintech backend | Browser-first live charts |

## Licensing

This adapter is paid, source-available software under an EULA. Market data is also subject to
[Twelve Data pricing and terms](https://twelvedata.com/pricing).
