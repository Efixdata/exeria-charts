# @efix-data/adapter-ccxt

Universal multi-exchange data adapter for [@efixdata/exeria-chart](https://github.com/efixdata/chart-repo) powered by [CCXT](https://github.com/ccxt/ccxt).

## Features

- One adapter for 100+ cryptocurrency exchanges via CCXT
- Historical OHLCV through `fetchOHLCV`
- Live price updates via REST polling (`fetchTicker`)
- Symbol normalization (`BTCUSDT`, `BTC-USDT`, `BTC/USDT`)
- Optional API keys for private endpoints

## When to use CCXT vs dedicated adapters

| Use CCXT | Use dedicated adapter (`adapter-binance`, `adapter-bybit`, …) |
| --- | --- |
| You need many exchanges quickly | You ship one exchange in production |
| Backend / Node.js integration | Browser live demo with WebSocket |
| Prototyping and research | Smallest bundle and lowest latency |

## Installation

```bash
npm install @efix-data/adapter-ccxt
```

Requires a peer dependency on `@efixdata/exeria-chart` (or `@exeria/charts`).

## Quick start (Node.js)

```typescript
import { createChart } from "@exeria/charts";
import { CcxtAdapter } from "@efix-data/adapter-ccxt";

const connector = new CcxtAdapter({ exchangeId: "kraken" });

const chart = createChart({
  container: "#chart",
  dataAdapter: connector,
});

chart.init();

await chart.loadData("BTCUSDT", {
  interval: "1h",
  limit: 500,
});

chart.subscribeToUpdates("BTCUSDT", (tick) => {
  console.log(tick.price ?? tick.c);
});
```

## Configuration

```typescript
const connector = new CcxtAdapter({
  exchangeId: "binance",
  apiKey: process.env.BINANCE_API_KEY,
  secret: process.env.BINANCE_API_SECRET,
  enableRateLimit: true,
  pollIntervalMs: 2000,
  sandbox: false,
});
```

## Verified exchanges

These ids are tested in development:

- `binance`, `bybit`, `okx`, `kraken`, `coinbase`, `kucoin`, `gate`, `bitfinex`, `mexc`

Any exchange id supported by CCXT can be passed to `exchangeId` if it exists in the CCXT library.

## Browser usage

Do **not** import CCXT directly in browser bundles for production charts. Most exchanges block cross-origin REST calls. Run CCXT on your server and proxy requests to the chart, or use a dedicated browser-friendly connector such as `@efix-data/adapter-binance`.

## License

MIT
