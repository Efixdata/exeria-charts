# @efixdata/connector-finage

Finage market data adapter for `@efixdata/exeria-chart` — forex OHLCV history and live prices.

> **License: paid, source-available (EULA).** The source is published for evaluation and
> integration. **Production or commercial use requires a paid license** from Efix Data Sp. z o. o.
> See the package `LICENSE` and the repository `LICENSING.md`.

## Install

```bash
npm install @efixdata/exeria-chart @efixdata/connector-finage
```

## Quick start

```ts
import { createChart } from "@efixdata/exeria-chart";
import { FinageAdapter } from "@efixdata/connector-finage";

const connector = new FinageAdapter({
  apiKey: process.env.FINAGE_API_KEY!,
});

const chart = createChart({ container, dataAdapter: connector });
chart.init();

await chart.loadData("EURUSD", { interval: "1h", limit: 500 });
chart.subscribeToUpdates("EURUSD");
```

## Configuration

| Option | Required | Description |
| --- | --- | --- |
| `apiKey` | Yes | Finage REST API key |
| `wsUrl` | No | Full WebSocket URL from Finage dashboard |
| `socketKey` + `wsSubdomain` + `wsPort` | No | Alternative WebSocket setup |
| `pollIntervalMs` | No | REST polling when WebSocket is not configured (default `3000`) |

Finage uses **compact forex symbols** (`EURUSD`, not `EUR/USD`). The adapter accepts slash and dash formats and normalizes them.

US **stocks and ETFs** (`AAPL`, `SPY`) use the same `loadData` API — the adapter routes to `/agg/stock/` and `/last/stock/` automatically.

## WebSocket

For live streaming, copy your WebSocket URL from the Finage dashboard:

```ts
const connector = new FinageAdapter({
  apiKey: process.env.FINAGE_API_KEY!,
  wsUrl: process.env.FINAGE_WS_URL!,
});
```

Without WebSocket config, `subscribeToUpdates` polls `/last/forex/{symbol}`.

## Licensing

This adapter is paid, source-available software under an EULA. Market data is also subject to
[Finage pricing and terms](https://finage.co.uk/pricing).
