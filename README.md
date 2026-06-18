# Exeria Charts

🏆 **Winner of the Benzinga Fintech Awards**

Source-available financial charting libraries for self-hosted web applications, trading surfaces, and data-rich dashboards.

**[🚀 Try the Live Playground](https://exeria.dev/playground)** • **[📚 Read Documentation](https://exeria.dev/docs/getting-started/vanilla)** • **[💻 View Data Connectors](https://exeria.dev/data-connectors)**

This repository contains a core chart runtime, a React UI wrapper, a documentation site, and internal playground apps used to validate the public package surface.

## Why Exeria Charts

- Render directly inside your application instead of embedding an iframe.
- Ship candlestick, line, bar, and histogram views from the same runtime.
- Update charts with candle batches or real-time ticks.
- Layer drawing tools, indicators, and UI controls on top of the core runtime.
- Keep the integration self-hosted and themeable inside your own product shell.

## Packages

### Core (AGPL-3.0-or-later)

| Package | Purpose |
| --- | --- |
| `@efixdata/exeria-chart` | Core chart runtime for vanilla JavaScript or framework-managed integrations |
| `@efixdata/exeria-chart-ui-react` | React toolbar and menu layer for teams that want prebuilt chart controls |

### Data connectors — free (MIT)

| Package | Data source |
| --- | --- |
| `@efixdata/connector-binance` | Binance spot |
| `@efixdata/connector-bybit` | Bybit |
| `@efixdata/connector-okx` | OKX |
| `@efixdata/connector-kraken` | Kraken |
| `@efixdata/connector-kucoin` | KuCoin |
| `@efixdata/connector-coinbase` | Coinbase |
| `@efixdata/connector-gate` | Gate.io |
| `@efixdata/connector-ccxt` | CCXT (multi-exchange) |
| `@efixdata/connector-coingecko` | CoinGecko |

### Data connectors — paid vendor (EULA, source-available)

| Package | Data source |
| --- | --- |
| `@efixdata/connector-twelve-data` | Twelve Data |
| `@efixdata/connector-finage` | Finage |
| `@efixdata/connector-finnhub` | Finnhub |
| `@efixdata/connector-eodhd` | EODHD |
| `@efixdata/connector-massive` | Massive |

Install a connector alongside the core chart:

```bash
npm install @efixdata/exeria-chart @efixdata/connector-binance
```

Publishing workflow and pre-release checks: [`PUBLISHING.md`](PUBLISHING.md).

## Quickstart

Install the core runtime:

```bash
npm install @efixdata/exeria-chart
```

Mount a chart with the public package API:

```ts
import { createChart, type Candle, type Interval } from "@efixdata/exeria-chart";

const candles: Candle[] = [
	{ stamp: 1715472000000, o: 101.2, h: 103.1, l: 100.9, c: 102.8, v: 3200 },
	{ stamp: 1715475600000, o: 102.8, h: 104.2, l: 102.1, c: 103.9, v: 2950 },
];

const interval: Interval = {
	symbol: "1h",
	milis: 60 * 60 * 1000,
};

const container = document.getElementById("chart-root");

if (!container) {
	throw new Error("Missing chart container");
}

const chart = createChart({ container });

await chart.setMainSeriesData(candles, interval);
chart.init();
```

If you want the React UI layer as well:

```bash
npm install @efixdata/exeria-chart @efixdata/exeria-chart-ui-react
```

## Public API Highlights

- Lifecycle: `init()`, `destroy()`
- Data: `setMainSeriesData()`, `appendMainSeriesData()`, `appendTick()`, `appendTicks()`
- View controls: `setMainDrawMode()`, `setValueAxisMode()`, `setAutoScale()`
- Integrations: `subscribe()`, `onDownload()`

## Documentation in This Repo

- Docs site source: `apps/docs`
- Core package guide: `packages/chart/README.md`
- React wrapper guide: `packages/react-chart-ui/README.md`
- License summary: `LICENSING.md`

Run the docs site locally:

```bash
npm install
npm --prefix apps/docs run dev
```

Run the chart playground locally:

```bash
npm --prefix apps/web run dev
```

## Repository Layout

- `packages/chart` contains the publishable core chart runtime.
- `packages/react-chart-ui` contains the React UI wrapper.
- `apps/docs` contains the Docusaurus documentation site.
- `apps/web` contains a broader review playground used for theme and runtime validation.

## Development

Install workspace dependencies and use the root scripts:

```bash
npm install
npm run build
npm run typecheck
```

For release-contract validation:

```bash
npm run verify:release
npm run verify:starters
```

See [`PUBLISHING.md`](PUBLISHING.md) for npm publish steps.

## Licensing

The core packages are open source under the **GNU Affero General Public License v3.0 (AGPL v3)**.

- Use the core for free when your product complies with AGPL (including source obligations for distributed or network-facing use).
- **Closed-source products** require a **commercial license** from Efix Data Sp. z o. o.
- **Plugins** (advanced indicators, drawing tools, data bridges) are licensed **per project** under separate terms.
- **Startup-friendly pricing** is available for qualifying commercial licenses.

Read `LICENSE`, `LICENSING.md`, and the [licensing guide](https://exeria.dev/docs/guides/licensing) before shipping to production.
