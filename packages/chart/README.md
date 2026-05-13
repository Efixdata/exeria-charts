# Exeria Charts

Exeria Charts is the core runtime package for self-hosted financial chart integrations.

For contributors and maintainers, start with:

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [MAINTAINER_ARCHITECTURE.md](MAINTAINER_ARCHITECTURE.md)

## Installation

```bash
npm install @efixdata/exeria-chart
```

## Quickstart

Example:

```js
import { createChart } from "@efixdata/exeria-chart";

const chart = createChart({
  container: DOMElement,
});

// Should be called when changing an instrument on the chart and before chart.init
chart.setMainSeriesData([
  {
    stamp: 1374796800000,
    o: 1.32729, // open
    h: 1.32963, // high
    l: 1.32519, // low
    c: 1.32771, // close
    v: 0, // volume
  },
  {
    stamp: 1375056000000,
    o: 1.32848,
    h: 1.32947,
    l: 1.32395,
    c: 1.32624,
    v: 0,
  },
]);

// Should be called only once
chart.init();
```

## When to Use This Package

Use the core runtime when you want direct control over:

- chart mounting and teardown
- your own toolbar and application chrome
- candle and tick data flow
- framework integration details

Stable public API surface

- Constructor/factory: `new Chart(options)` and `createChart(options)`
- Lifecycle: `init()`, `destroy()`
- Data: `setMainSeriesData(data, interval?, moveToEnd?)`, `appendMainSeriesData(data)`, `appendTick(tick)`, `appendTicks(ticks)`
- View controls: `setMainDrawMode(mode)`, `setValueAxisMode(mode)`, `setAutoScale(isEnabled)`
- Integrations: `subscribe(topic, callback)`, `onDownload(watermark?, width?, height?)`

## Next Steps

- Read the repository root `README.md` for the broader project overview.
- Use the docs app in `apps/docs` for guided quickstarts and future API guides.
- Reach for `@efixdata/exeria-chart-ui-react` only if you want the prebuilt React controls.

Appending candles to the main series

```js
chart.appendMainSeriesData([
  {
    stamp: 1374796800000,
    o: 1.32729, // open
    h: 1.32963, // high
    l: 1.32519, // low
    c: 1.32771, // close
    v: 0, // volume
  },
  {
    stamp: 1375056000000,
    o: 1.32848,
    h: 1.32947,
    l: 1.32395,
    c: 1.32624,
    v: 0,
  },
]);
```

Appending a tick to main series. The tick will be added to the current or next candle based on the stamp value.

```js
chart.appendTick({
  stamp: 1375056000000,
  price: 1.32849,
  volume: 1000,
  dailyVolume: 101938, // not needed - will set the volume value if the interval is set to 1 day
});
```

## License

This package is source-available under the Exeria Charts Source Available License 1.0.
Personal use, education, qualifying open source projects, and qualifying small-scale use are
allowed under the Additional Use Grant. Other commercial use requires a separate commercial
license from Efix Data Sp. z o. o. See the bundled `LICENSE` file and the repository
`LICENSING.md` for the full legal terms and usage summary.
