# @efixdata/connector-massive

Market data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) powered by [Massive](https://massive.com/) (formerly Polygon.io) — US stocks, forex, and crypto OHLCV.

> **License: paid, source-available (EULA).** The source is published for evaluation and
> integration. **Production or commercial use requires a paid license** from Efix Data Sp. z o. o.
> See the package `LICENSE` and the repository `LICENSING.md`.

## Features

- US stocks (`AAPL`, `SPY`), forex (`EUR/USD`), and crypto (`BTC-USD`) on one adapter
- REST aggregates with pagination
- Real-time updates via per-market WebSocket channels (AM / CA / XA)
- Automatic market detection and symbol normalization

## Requirements

- **API key** from [Massive](https://massive.com/) (required)
- Node.js 18+ with `fetch`

## Installation

```bash
npm install @efixdata/exeria-chart @efixdata/connector-massive
```

## Quick Start

```typescript
import { createChart } from "@efixdata/exeria-chart";
import { MassiveAdapter } from "@efixdata/connector-massive";

const connector = new MassiveAdapter({
  apiKey: process.env.MASSIVE_API_KEY!,
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

chart.subscribeToUpdates("AAPL");
```

Do **not** embed your API key in browser bundles — run this adapter on your server or behind a proxy.

## API Reference

`MassiveAdapter` implements the `DataAdapter` interface from `@efixdata/exeria-chart`:

- `initialize(config)`
- `getHistoricalData(symbol, options)`
- `getCurrentPrice(symbol)`
- `subscribeToUpdates(symbol, callback)`
- `disconnect()`

## Licensing

This adapter is paid, source-available software under an EULA. Market data is also subject to
[Massive pricing and terms](https://massive.com/pricing).
