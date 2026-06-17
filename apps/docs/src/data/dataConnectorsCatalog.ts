export type DataConnectorLicenseType = "mit" | "eula";

export type DataConnectorStatus = "available" | "coming_soon";

export type DataConnectorPricing =
  | {
      kind: "free";
      summary: string;
    }
  | {
      kind: "freemium";
      summary: string;
      providerPricingUrl?: string;
    }
  | {
      kind: "paid";
      summary: string;
      providerPricingUrl: string;
      affiliateUrl?: string;
      partnerCode?: string;
    };

export type DataConnectorEntry = {
  id: string;
  packageName: string;
  npmPackage?: string;
  providerName: string;
  dataTypes: string[];
  transport: ("REST" | "WebSocket")[];
  description: string;
  audience: string;
  highlights: string[];
  pricing: DataConnectorPricing;
  license: DataConnectorLicenseType;
  status: DataConnectorStatus;
  downloadUrl?: string;
  repositoryUrl?: string;
  docsUrl?: string;
  integrationFactory: string;
  integrationSymbol: string;
  integrationInterval: string;
};

const PLACEHOLDER_REPO = "https://github.com/Efixdata/exeria-charts";

function connectorPackagePath(id: string): string {
  return `${PLACEHOLDER_REPO}/tree/main/packages/adapter-${id.replace(/-public$/, "")}`;
}

export function getConnectorInstallCommand(connector: DataConnectorEntry): string | undefined {
  return connector.npmPackage ? `npm i ${connector.npmPackage}` : undefined;
}

function buildConnectorConstruction(connector: DataConnectorEntry): string {
  if (connector.integrationFactory.startsWith("create")) {
    return `const connector = ${connector.integrationFactory}({
  /* see connector docs for config */
});`;
  }

  return `const connector = new ${connector.integrationFactory}();`;
}

export function getConnectorIntegrationSnippet(connector: DataConnectorEntry): string {
  return `import { createChart } from "@efixdata/exeria-chart";
import { ${connector.integrationFactory} } from "${connector.packageName}";

${buildConnectorConstruction(connector)}

const chart = createChart({ container, dataAdapter: connector });
chart.init();

await chart.loadData("${connector.integrationSymbol}", {
  interval: "${connector.integrationInterval}",
  limit: 500,
});

chart.subscribeToUpdates("${connector.integrationSymbol}");`;
}

export function getConnectorFeatureItems(connector: DataConnectorEntry): string[] {
  const items = [`Built for ${connector.audience.replace(/\.$/, "")}`, ...connector.highlights];
  return items.slice(0, 2);
}

export function getConnectorPricingLabel(connector: DataConnectorEntry): string {
  const { pricing } = connector;
  if (pricing.kind === "free") {
    return "Free data";
  }
  if (pricing.kind === "freemium") {
    return "Freemium";
  }
  return "Paid data";
}

export function getConnectorPricingSummary(connector: DataConnectorEntry): string {
  return connector.pricing.summary;
}

export function getConnectorLicenseShort(connector: DataConnectorEntry): string {
  return connector.license === "mit" ? "MIT" : "EULA";
}

export function getConnectorStatusLabel(connector: DataConnectorEntry): string {
  return connector.status === "available" ? "Available" : "Coming soon";
}

export function connectorMatchesSearch(connector: DataConnectorEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    connector.providerName,
    connector.packageName,
    connector.description,
    ...connector.dataTypes,
    ...connector.transport,
    getConnectorPricingLabel(connector),
    getConnectorLicenseShort(connector),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export const DATA_CONNECTOR_LICENSE_LABELS: Record<DataConnectorLicenseType, string> = {
  mit: "MIT License",
  eula: "Commercial EULA (source-available)",
};

export const DATA_CONNECTOR_LICENSE_URLS: Record<DataConnectorLicenseType, string> = {
  mit: "https://opensource.org/license/mit",
  eula: "/docs/guides/licensing",
};

export const dataConnectorCatalog: DataConnectorEntry[] = [
  {
    id: "binance-public",
    packageName: "@efixdata/connector-binance",
    npmPackage: "@efixdata/connector-binance",
    providerName: "Binance",
    dataTypes: ["Crypto spot", "Crypto futures", "Trades", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles, trades, and order-book snapshots from Binance public market data endpoints.",
    audience: "Crypto dashboards, DEX frontends, retail trading apps, and research tools.",
    highlights: [
      "Public endpoints with no vendor subscription",
      "WebSocket streams for live candle updates",
      "Maps directly to Exeria series and realtime APIs",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "BinanceAdapter",
    integrationSymbol: "BTCUSDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: connectorPackagePath("binance-public"),
    docsUrl: "/docs/data-connectors/binance",
  },
  {
    id: "bybit-public",
    packageName: "@efixdata/connector-bybit",
    npmPackage: "@efixdata/connector-bybit",
    providerName: "Bybit",
    dataTypes: ["Crypto spot", "Crypto perps", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from Bybit public v5 market data endpoints (spot by default).",
    audience: "Crypto dashboards, multi-exchange terminals, and research tools.",
    highlights: [
      "Public spot endpoints with no vendor subscription",
      "WebSocket kline streams with heartbeat and auto-reconnect",
      "Same BTCUSDT symbol format as Binance",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "BybitAdapter",
    integrationSymbol: "BTCUSDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-bybit`,
    docsUrl: "/docs/data-connectors/bybit",
  },
  {
    id: "okx-public",
    packageName: "@efixdata/connector-okx",
    npmPackage: "@efixdata/connector-okx",
    providerName: "OKX",
    dataTypes: ["Crypto spot", "Crypto perps", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from OKX public v5 market data endpoints with automatic REST pagination.",
    audience: "Crypto dashboards, multi-exchange terminals, and Asia-focused trading apps.",
    highlights: [
      "Public spot endpoints with no vendor subscription",
      "Automatic pagination above 300-candle REST pages",
      "Accepts BTC-USDT and compact BTCUSDT symbol formats",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "OkxAdapter",
    integrationSymbol: "BTC-USDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-okx`,
    docsUrl: "/docs/data-connectors/okx",
  },
  {
    id: "kraken-public",
    packageName: "@efixdata/connector-kraken",
    npmPackage: "@efixdata/connector-kraken",
    providerName: "Kraken",
    dataTypes: ["Crypto spot", "USD pairs", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from Kraken public Spot API with WebSocket v2 OHLC streams.",
    audience: "Crypto dashboards, USD spot apps, and Kraken-native trading products.",
    highlights: [
      "Public endpoints with no vendor subscription",
      "WebSocket v2 OHLC with heartbeat and reconnect handling",
      "Accepts BTC/USD, BTCUSD, and XBTUSD symbol formats",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "KrakenAdapter",
    integrationSymbol: "BTC/USD",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-kraken`,
    docsUrl: "/docs/data-connectors/kraken",
  },
  {
    id: "kucoin-public",
    packageName: "@efixdata/connector-kucoin",
    npmPackage: "@efixdata/connector-kucoin",
    providerName: "KuCoin",
    dataTypes: ["Crypto spot", "USDT pairs", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from KuCoin public Spot API with Classic WebSocket kline streams.",
    audience: "Crypto dashboards, USDT spot apps, and KuCoin-native trading products.",
    highlights: [
      "Public endpoints with no vendor subscription",
      "WebSocket token bootstrap with ping/pong heartbeat",
      "Accepts BTC-USDT and compact BTCUSDT symbol formats",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "KucoinAdapter",
    integrationSymbol: "BTC-USDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-kucoin`,
    docsUrl: "/docs/data-connectors/kucoin",
  },
  {
    id: "coinbase-public",
    packageName: "@efixdata/connector-coinbase",
    npmPackage: "@efixdata/connector-coinbase",
    providerName: "Coinbase",
    dataTypes: ["Crypto spot", "USD / USDC pairs", "OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from Coinbase Advanced Trade public API with ticker_batch WebSocket streaming.",
    audience: "US crypto apps, Coinbase-native dashboards, and browser-first trading UIs.",
    highlights: [
      "Public endpoints with no vendor subscription",
      "WebSocket heartbeats + ticker_batch live prices",
      "Accepts BTC-USD and compact BTCUSD symbol formats",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "CoinbaseAdapter",
    integrationSymbol: "BTC-USD",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-coinbase`,
    docsUrl: "/docs/data-connectors/coinbase",
  },
  {
    id: "gate-public",
    packageName: "@efixdata/connector-gate",
    npmPackage: "@efixdata/connector-gate",
    providerName: "Gate.io",
    dataTypes: ["Crypto spot", "USDT pairs", "Klines / OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Connect live and historical crypto candles from Gate.io public Spot API v4 with native BTC_USDT symbols and candlestick WebSocket streaming.",
    audience: "Crypto dashboards, Gate-native trading apps, and browser-first terminals.",
    highlights: [
      "Public endpoints with no vendor subscription",
      "WebSocket spot.candlesticks live candle updates",
      "Accepts BTC_USDT and compact BTCUSDT symbol formats",
    ],
    pricing: {
      kind: "free",
      summary: "Free — public API (rate limits apply)",
    },
    license: "mit",
    status: "available",
    integrationFactory: "GateAdapter",
    integrationSymbol: "BTC_USDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-gate`,
    docsUrl: "/docs/data-connectors/gate",
  },
  {
    id: "ccxt-universal",
    packageName: "@efixdata/connector-ccxt",
    npmPackage: "@efixdata/connector-ccxt",
    providerName: "CCXT (multi-exchange)",
    dataTypes: ["Crypto spot", "Crypto futures", "OHLCV", "100+ exchanges"],
    transport: ["REST"],
    description:
      "Universal connector powered by CCXT — connect Kraken, KuCoin, Gate, and 100+ other exchanges with one package and a single exchangeId config.",
    audience: "Multi-exchange backends, research tools, and rapid prototyping on Node.js.",
    highlights: [
      "Swap exchangeId without changing chart code",
      "Public market data on most exchanges without API keys",
      "Same DataAdapter contract as Binance and Bybit connectors",
    ],
    pricing: {
      kind: "free",
      summary: "Free — CCXT MIT + exchange rate limits apply",
    },
    license: "mit",
    status: "available",
    integrationFactory: "createCcxtAdapter",
    integrationSymbol: "BTCUSDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-ccxt`,
    docsUrl: "/docs/data-connectors/ccxt",
  },
  {
    id: "twelve-data",
    packageName: "@efixdata/connector-twelve-data",
    npmPackage: "@efixdata/connector-twelve-data",
    providerName: "Twelve Data",
    dataTypes: ["Forex", "Stocks", "Crypto", "ETF", "OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Forex, stocks, and crypto OHLCV from Twelve Data — one API key, unified REST and WebSocket for multi-asset fintech apps.",
    audience: "Forex dashboards, wealth apps, and multi-asset trading prototypes.",
    highlights: [
      "Forex majors with EUR/USD-style symbols",
      "Historical OHLCV and WebSocket live prices",
      "Same DataAdapter contract as crypto connectors",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free dev tier; paid for production display",
      providerPricingUrl: "https://twelvedata.com/pricing",
    },
    license: "eula",
    status: "available",
    integrationFactory: "createTwelveDataAdapter",
    integrationSymbol: "EUR/USD",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-twelve-data`,
    docsUrl: "/docs/data-connectors/twelve-data",
  },
  {
    id: "finage",
    packageName: "@efixdata/connector-finage",
    npmPackage: "@efixdata/connector-finage",
    providerName: "Finage",
    dataTypes: ["Forex", "Stocks", "Crypto", "OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "Forex OHLCV from Finage — UK-based market data with REST aggregates and optional WebSocket streaming.",
    audience: "Forex dashboards, UK/EU fintech apps, and multi-asset prototypes.",
    highlights: [
      "Compact forex symbols (EURUSD)",
      "Historical aggregates and last-quote REST endpoints",
      "WebSocket with per-account URL from Finage dashboard",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free API key; paid for higher limits / display",
      providerPricingUrl: "https://finage.co.uk/pricing",
    },
    license: "eula",
    status: "available",
    integrationFactory: "createFinageAdapter",
    integrationSymbol: "EURUSD",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-finage`,
    docsUrl: "/docs/data-connectors/finage",
  },
  {
    id: "finnhub",
    packageName: "@efixdata/connector-finnhub",
    npmPackage: "@efixdata/connector-finnhub",
    providerName: "Finnhub",
    dataTypes: ["Stocks", "Forex", "Crypto", "OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "US stocks, forex, and crypto OHLCV from Finnhub — one API token, parallel-array candles, and WebSocket trades.",
    audience: "Wealth apps, fintech dashboards, and multi-asset prototypes.",
    highlights: [
      "Stocks (AAPL), forex (EUR/USD), crypto (BTCUSDT) on one adapter",
      "OANDA forex and BINANCE crypto symbol normalization",
      "WebSocket at wss://ws.finnhub.io with token auth",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free token for quotes; paid for OHLCV candles",
      providerPricingUrl: "https://finnhub.io/pricing",
    },
    license: "eula",
    status: "available",
    integrationFactory: "createFinnhubAdapter",
    integrationSymbol: "AAPL",
    integrationInterval: "1d",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-finnhub`,
    docsUrl: "/docs/data-connectors/finnhub",
  },
  {
    id: "eodhd",
    packageName: "@efixdata/connector-eodhd",
    npmPackage: "@efixdata/connector-eodhd",
    providerName: "EODHD",
    dataTypes: ["Stocks", "Forex", "Crypto", "ETF", "OHLCV"],
    transport: ["REST"],
    description:
      "Global stocks, forex, and crypto OHLCV from EODHD — deep end-of-day history and intraday bars on paid plans.",
    audience: "Wealth apps, portfolio analytics, and global equity dashboards.",
    highlights: [
      "Stocks (AAPL.US), forex (EURUSD.FOREX), crypto (BTC-USD.CC)",
      "EOD API with daily, weekly, and monthly periods",
      "Live (delayed) prices via /real-time with REST polling",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free EOD (~1 year); intraday on paid plans",
      providerPricingUrl: "https://eodhd.com/pricing",
    },
    license: "eula",
    status: "available",
    integrationFactory: "createEodhdAdapter",
    integrationSymbol: "AAPL",
    integrationInterval: "1d",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-eodhd`,
    docsUrl: "/docs/data-connectors/eodhd",
  },
  {
    id: "massive-public",
    packageName: "@efixdata/connector-massive",
    npmPackage: "@efixdata/connector-massive",
    providerName: "Massive",
    dataTypes: ["Stocks", "Forex", "Crypto", "OHLCV"],
    transport: ["REST", "WebSocket"],
    description:
      "US stocks, forex, and crypto OHLCV from Massive (formerly Polygon.io) — one API key, per-market WebSocket endpoints.",
    audience: "Wealth apps, trading terminals, and multi-asset fintech dashboards.",
    highlights: [
      "Stocks (AAPL), forex (EUR/USD), crypto (BTC-USD) on one adapter",
      "REST aggregates with pagination",
      "WebSocket AM / CA / XA channels per asset class",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free trial; paid for production display",
      providerPricingUrl: "https://massive.com/pricing",
    },
    license: "eula",
    status: "available",
    integrationFactory: "MassiveAdapter",
    integrationSymbol: "AAPL",
    integrationInterval: "1d",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-massive`,
    docsUrl: "/docs/data-connectors/massive",
  },
  {
    id: "coingecko",
    packageName: "@efixdata/connector-coingecko",
    npmPackage: "@efixdata/connector-coingecko",
    providerName: "CoinGecko",
    dataTypes: ["Crypto OHLCV", "Market cap", "10,000+ assets"],
    transport: ["REST"],
    description:
      "Load historical and daily crypto market data for broad asset coverage without operating your own ingestion pipeline.",
    audience: "Portfolio trackers, market news embeds, and multi-asset comparison screens.",
    highlights: [
      "Wide asset coverage out of the box",
      "Simple REST integration for dashboards",
      "Near-real-time price polling every 60 seconds",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free Demo tier; paid for production",
      providerPricingUrl: "https://www.coingecko.com/en/api/pricing",
    },
    license: "mit",
    status: "available",
    integrationFactory: "CoingeckoAdapter",
    integrationSymbol: "bitcoin",
    integrationInterval: "1d",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: `${PLACEHOLDER_REPO}/tree/main/packages/adapter-coingecko`,
    docsUrl: "/docs/data-connectors/coingecko",
  },
];
