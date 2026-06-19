<video src="https://github.com/user-attachments/assets/20d31b71-ad8c-4b09-aa13-21006d9e5f91" width="100%" controls autoplay loop muted></video>

<h1 align="center">Exeria Charts</h1>

<p align="center">
  <b>Source-available, high-performance financial charting libraries for self-hosted web applications, trading platforms, and data-rich dashboards.</b>
</p>

<p align="center">
  <a href="https://exeria.dev/playground">🚀 Live Playground</a> •
  <a href="https://exeria.dev/docs/getting-started/vanilla">📚 Documentation</a> •
  <a href="https://exeria.dev/data-connectors">💻 Data Connectors</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@efixdata/exeria-chart"><img src="https://img.shields.io/npm/v/@efixdata/exeria-chart?style=flat-square&color=blue" alt="NPM Version" /></a>
  <a href="https://github.com/efixdata/exeria-charts/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-green?style=flat-square" alt="License" /></a>
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
  <img src="https://img.shields.io/badge/award-Benzinga_Fintech_Awards-gold?style=flat-square" alt="Winner of the Benzinga Fintech Awards" />
</p>

---

## ✨ Why Exeria Charts?

Building a trading interface shouldn't require compromising on performance or user experience. Exeria Charts gives you the power of professional-grade financial charts, directly inside your application.

- ⚡️ **Native Integration**: Render directly inside your app (Canvas/WebGL) instead of relying on sluggish `<iframe>` embeds.
- 📊 **Versatile Views**: Ship candlestick, line, bar, and histogram views using a single, unified runtime.
- ⏱ **Real-time Ready**: Seamlessly update charts with historical candle batches or stream real-time ticks with sub-millisecond latency.
- 🎨 **Fully Customizable**: Layer drawing tools, technical indicators, and UI controls perfectly themed to match your product shell.
- 🔒 **Self-Hosted & Secure**: Keep your users' data secure by hosting the runtime entirely within your own infrastructure.

## 📦 Ecosystem

Exeria provides a robust ecosystem tailored to both framework-agnostic developers and React teams.

### Core Libraries

| Package | Purpose | License |
| --- | --- | --- |
| [`@efixdata/exeria-chart`](packages/chart) | Core chart runtime for vanilla JS or framework-managed integrations | AGPL-3.0 |
| [`@efixdata/exeria-chart-ui-react`](packages/react-chart-ui) | React toolbar & menu layer with prebuilt chart controls | AGPL-3.0 |

### Data Connectors

Connect to your favorite exchanges out-of-the-box.

**Free & Open Source (MIT)**:  
`@efixdata/connector-binance`, `@efixdata/connector-bybit`, `@efixdata/connector-okx`, `@efixdata/connector-kraken`, `@efixdata/connector-kucoin`, `@efixdata/connector-coinbase`, `@efixdata/connector-gate`, `@efixdata/connector-ccxt`, `@efixdata/connector-coingecko`.

**Premium Vendor Connectors (EULA, source-available)**:  
`@efixdata/connector-twelve-data`, `@efixdata/connector-finage`, `@efixdata/connector-finnhub`, `@efixdata/connector-eodhd`, `@efixdata/connector-massive`.

## 🚀 Quick Start

### 1. Installation

Install the core runtime and a data connector:

```bash
npm install @efixdata/exeria-chart @efixdata/connector-binance
```
*(Optional: Add `@efixdata/exeria-chart-ui-react` for the React UI layer)*

### 2. Basic Setup (Vanilla JS/TS)

```ts
import { createChart, type Candle, type Interval } from "@efixdata/exeria-chart";

// 1. Prepare your data
const candles: Candle[] = [
  { stamp: 1715472000000, o: 101.2, h: 103.1, l: 100.9, c: 102.8, v: 3200 },
  { stamp: 1715475600000, o: 102.8, h: 104.2, l: 102.1, c: 103.9, v: 2950 },
];

const interval: Interval = { symbol: "1h", milis: 60 * 60 * 1000 };

// 2. Initialize the chart
const container = document.getElementById("chart-root");
if (!container) throw new Error("Missing chart container");

const chart = createChart({ container });

// 3. Mount and render
await chart.setMainSeriesData(candles, interval);
chart.init();
```

## 📖 Documentation & Resources

- [**Full Documentation Site**](https://exeria.dev/docs/getting-started/vanilla) - Guides, API references, and advanced use cases.
- [**Public API Highlights**](https://exeria.dev/docs/api) - `init()`, `destroy()`, `setMainSeriesData()`, `appendTick()`, and more.
- [**Live Playground**](https://exeria.dev/playground) - Test themes, indicators, and real-time data integrations.

## 🛠 Development

Want to build Exeria locally or contribute? This repository is a monorepo powered by [Turbo](https://turbo.build/).

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run local playground
npm --prefix apps/web run dev

# Run local docs site
npm --prefix apps/docs run dev
```

See our [`CONTRIBUTING.md`](CONTRIBUTING.md) for detailed guidelines.

## ⚖️ Licensing

Exeria Charts operates under a dual-license model to support both the open-source community and commercial platforms.

- **Open Source (AGPL-3.0-or-later)**: Use the core freely for projects that comply with the AGPL v3 (including source obligations for distributed or network-facing use).
- **Commercial License**: Required for closed-source products. Purchasing a commercial license from Efix Data Sp. z o. o. removes the AGPL restrictions. [Contact us for startup-friendly pricing!](https://exeria.dev/pricing)

*Note: Data connectors have their own licenses (MIT for public exchanges, EULA for premium vendors).*

Please read [`LICENSE`](LICENSE), [`LICENSING.md`](LICENSING.md), and our [Licensing Guide](https://exeria.dev/docs/guides/licensing) carefully before shipping to production.

---
<p align="center">Made with ❤️ by the Exeria Team.</p>