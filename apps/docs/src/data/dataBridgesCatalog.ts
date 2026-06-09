export type DataBridgeLicenseType = "mit" | "source-available-commercial";

export type DataBridgeStatus = "available" | "coming_soon";

export type DataBridgePricing =
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

export type DataBridgeEntry = {
  id: string;
  pluginName: string;
  npmPackage?: string;
  providerName: string;
  dataTypes: string[];
  transport: ("REST" | "WebSocket")[];
  description: string;
  audience: string;
  highlights: string[];
  pricing: DataBridgePricing;
  license: DataBridgeLicenseType;
  status: DataBridgeStatus;
  downloadUrl?: string;
  repositoryUrl?: string;
  docsUrl?: string;
  integrationFactory: string;
  integrationSymbol: string;
  integrationInterval: string;
};

const PLACEHOLDER_REPO = "https://github.com/Efixdata/exeria-charts";

function bridgePackagePath(id: string): string {
  return `${PLACEHOLDER_REPO}/tree/main/packages/data-bridge-${id.replace(/-public$/, "").replace(/^partner-/, "partner-")}`;
}

export function getBridgeInstallCommand(bridge: DataBridgeEntry): string | undefined {
  return bridge.npmPackage ? `npm i ${bridge.npmPackage}` : undefined;
}

export function getBridgeIntegrationSnippet(bridge: DataBridgeEntry): string {
  return `import { Chart } from "@efixdata/exeria-chart";
import { ${bridge.integrationFactory} } from "${bridge.pluginName}";

const chart = new Chart({ container: "#chart" });
const bridge = ${bridge.integrationFactory}({
  symbol: "${bridge.integrationSymbol}",
  interval: "${bridge.integrationInterval}",
});

await chart.loadData(bridge.fetchHistorical());
bridge.subscribeRealtime((bar) => chart.updateBar(bar));`;
}

export function getBridgeFeatureItems(bridge: DataBridgeEntry): string[] {
  const items = [`Built for ${bridge.audience.replace(/\.$/, "")}`, ...bridge.highlights];
  return items.slice(0, 2);
}

export function getBridgePricingLabel(bridge: DataBridgeEntry): string {
  const { pricing } = bridge;
  if (pricing.kind === "free") {
    return "Free data";
  }
  if (pricing.kind === "freemium") {
    return "Freemium";
  }
  return "Paid data";
}

export function getBridgePricingSummary(bridge: DataBridgeEntry): string {
  return bridge.pricing.summary;
}

export function getBridgeLicenseShort(bridge: DataBridgeEntry): string {
  return bridge.license === "mit" ? "MIT" : "Commercial";
}

export function getBridgeStatusLabel(bridge: DataBridgeEntry): string {
  return bridge.status === "available" ? "Available" : "Coming soon";
}

export function bridgeMatchesSearch(bridge: DataBridgeEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    bridge.providerName,
    bridge.pluginName,
    bridge.description,
    ...bridge.dataTypes,
    ...bridge.transport,
    getBridgePricingLabel(bridge),
    getBridgeLicenseShort(bridge),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

export const DATA_BRIDGE_LICENSE_LABELS: Record<DataBridgeLicenseType, string> = {
  mit: "MIT License",
  "source-available-commercial": "Source-Available Commercial License",
};

export const DATA_BRIDGE_LICENSE_URLS: Record<DataBridgeLicenseType, string> = {
  mit: "https://opensource.org/license/mit",
  "source-available-commercial": "/data-bridges#partner-license",
};

export const dataBridgeCatalog: DataBridgeEntry[] = [
  {
    id: "binance-public",
    pluginName: "@exeria/data-bridge-binance",
    npmPackage: "@exeria/data-bridge-binance",
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
    integrationFactory: "createBinanceBridge",
    integrationSymbol: "BTCUSDT",
    integrationInterval: "1h",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: bridgePackagePath("binance-public"),
    docsUrl: "/docs/data-bridges/binance",
  },
  {
    id: "coingecko",
    pluginName: "@exeria/data-bridge-coingecko",
    npmPackage: "@exeria/data-bridge-coingecko",
    providerName: "CoinGecko",
    dataTypes: ["Crypto OHLCV", "Market cap", "10,000+ assets"],
    transport: ["REST"],
    description:
      "Load historical and daily crypto market data for broad asset coverage without operating your own ingestion pipeline.",
    audience: "Portfolio trackers, market news embeds, and multi-asset comparison screens.",
    highlights: [
      "Wide asset coverage out of the box",
      "Simple REST integration for dashboards",
      "Free Demo API tier for development",
    ],
    pricing: {
      kind: "freemium",
      summary: "Free Demo tier; paid for production",
      providerPricingUrl: "https://www.coingecko.com/en/api/pricing",
    },
    license: "mit",
    status: "coming_soon",
    integrationFactory: "createCoingeckoBridge",
    integrationSymbol: "bitcoin",
    integrationInterval: "1d",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: bridgePackagePath("coingecko"),
    docsUrl: "/docs/data-bridges/coingecko",
  },
  {
    id: "partner-equities",
    pluginName: "@exeria/data-bridge-partner-equities",
    npmPackage: "@exeria/data-bridge-partner-equities",
    providerName: "Partner provider (TBA)",
    dataTypes: ["US equities", "ETFs", "Real-time quotes", "Historical bars"],
    transport: ["REST", "WebSocket"],
    description:
      "Production-grade US equities and ETF coverage with consolidated feeds suitable for professional charting surfaces.",
    audience: "Fintech apps, broker workstations, and institutional analytics products.",
    highlights: [
      "Enterprise-grade latency and symbol coverage",
      "Complimentary plugin when you subscribe via Exeria partner link",
      "Same public pricing as buying directly from the provider",
    ],
    pricing: {
      kind: "paid",
      summary: "Paid subscription — plugin included via Exeria",
      providerPricingUrl: "https://exeriacharts.dev/data-bridges#partner-equities",
      affiliateUrl: "https://exeriacharts.dev/data-bridges#partner-equities",
      partnerCode: "EXERIA-PARTNER",
    },
    license: "source-available-commercial",
    status: "coming_soon",
    integrationFactory: "createPartnerEquitiesBridge",
    integrationSymbol: "AAPL",
    integrationInterval: "1m",
    downloadUrl: `${PLACEHOLDER_REPO}/releases`,
    repositoryUrl: bridgePackagePath("partner-equities"),
    docsUrl: "/docs/data-bridges/partner-equities",
  },
];
