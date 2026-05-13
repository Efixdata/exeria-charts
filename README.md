# Exeria Charts

Source-available financial charting libraries for self-hosted web applications, trading surfaces, and data-rich dashboards.

This repository contains a core chart runtime, a React UI wrapper, a documentation site, and internal playground apps used to validate the public package surface.

## Why Exeria Charts

- Render directly inside your application instead of embedding an iframe.
- Ship candlestick, line, bar, and histogram views from the same runtime.
- Update charts with candle batches or real-time ticks.
- Layer drawing tools, indicators, and UI controls on top of the core runtime.
- Keep the integration self-hosted and themeable inside your own product shell.

## Packages

| Package | Purpose |
| --- | --- |
| `@efixdata/exeria-chart` | Core chart runtime for vanilla JavaScript or framework-managed integrations |
| `@efixdata/exeria-chart-ui-react` | React toolbar and menu layer for teams that want prebuilt chart controls |

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
```

## Licensing

This repository is source-available under the Exeria Charts Source Available License 1.0.

- Personal use is allowed.
- Educational use is allowed.
- Qualifying open source and qualifying small-scale commercial use are allowed under the Additional Use Grant.
- Other commercial use requires a separate commercial license from Efix Data Sp. z o. o.

This is not an OSI-approved open source license. Read `LICENSE` and `LICENSING.md` before using the packages in a production or commercial setting.
