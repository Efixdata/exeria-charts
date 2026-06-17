# @efixdata/connector-eodhd

Market data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) powered by [EODHD](https://eodhd.com/) — stocks, forex, and crypto OHLCV.

> **License: paid, source-available (EULA).** The source is published for evaluation and
> integration. **Production or commercial use requires a paid license** from Efix Data Sp. z o. o.
> See the package `LICENSE` and the repository `LICENSING.md`.

## Features

- End-of-day OHLCV via `/api/eod/` (`1d`, `1w`, `1M`)
- Intraday OHLCV via `/api/intraday/` (`1m`, `5m`, `1h`)
- Live (delayed) price updates via `/api/real-time/` with REST polling
- Symbol normalization (`AAPL` → `AAPL.US`, `EUR/USD` → `EURUSD.FOREX`, `BTC-USD` → `BTC-USD.CC`)

## Requirements

- **API token** from [EODHD](https://eodhd.com/) (required)
- Node.js 18+ with `fetch`

## Installation

```bash
npm install @efixdata/connector-eodhd
```

## Quick start

```typescript
import { createChart } from "@efixdata/exeria-chart";
import { EodhdAdapter } from "@efixdata/connector-eodhd";

const connector = new EodhdAdapter({
  apiKey: process.env.EODHD_API_KEY!,
});

const chart = createChart({
  container: "#chart",
  dataAdapter: connector,
});

chart.init();

await chart.loadData("AAPL", {
  interval: "1d",
  limit: 500,
});

chart.subscribeToUpdates("AAPL", (tick) => {
  console.log(tick.price ?? tick.c);
});
```

## Configuration

```typescript
const connector = new EodhdAdapter({
  apiKey: process.env.EODHD_API_KEY!,
  baseUrl: "https://eodhd.com/api",
  defaultStockExchange: "US",
  pollIntervalMs: 5000,
  requestTimeout: 10000,
  maxRetries: 3,
  onError: (error) => console.error(error),
});
```

## Supported intervals

| Exeria | EODHD source |
| --- | --- |
| `1m`, `5m`, `1h` | Intraday API |
| `1d`, `1w`, `1M` | End-of-day API |

Intervals such as `15m`, `30m`, `2h`, and `4h` are not supported natively and throw an error.

## Licensing

This adapter is paid, source-available software under an EULA (see the package `LICENSE` and the repository `LICENSING.md`).

EODHD free tiers are for **development and personal use**. Production apps with external display require a paid plan. See [EODHD pricing](https://eodhd.com/pricing).

Do **not** embed your API token in browser bundles — run this adapter on your server or behind a proxy.

## When to use EODHD vs other connectors

- **US/global stocks with deep EOD history** → EODHD
- **US stocks + real-time aggregates on one vendor** → [Massive](../adapter-massive)
- **Quick multi-asset demo with one key** → [Twelve Data](../adapter-twelve-data)
- **Crypto exchange spot, no API key** → [Binance](../adapter-binance), [Gate.io](../adapter-gate)
