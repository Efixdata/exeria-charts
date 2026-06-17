export type LegacyRedirect = {
  from: string;
  to: string;
};

export const legacyRedirects: LegacyRedirect[] = [
  { from: "/docs/adapters/overview", to: "/docs/data-connectors/overview" },
  { from: "/docs/adapters/binance-adapter", to: "/docs/data-connectors/binance" },
  { from: "/docs/adapters/bybit-adapter", to: "/docs/data-connectors/bybit" },
  { from: "/docs/adapters/okx-adapter", to: "/docs/data-connectors/okx" },
  {
    from: "/docs/adapters/coingecko-adapter",
    to: "/docs/data-connectors/coingecko",
  },
  { from: "/docs/adapters/kraken-adapter", to: "/docs/data-connectors/kraken" },
  { from: "/docs/adapters/kucoin-adapter", to: "/docs/data-connectors/kucoin" },
  {
    from: "/docs/adapters/coinbase-adapter",
    to: "/docs/data-connectors/coinbase",
  },
  {
    from: "/docs/adapters/gate-adapter",
    to: "/docs/data-connectors/gate",
  },
  {
    from: "/docs/adapters/eodhd-adapter",
    to: "/docs/data-connectors/eodhd",
  },
  {
    from: "/docs/adapters/polygon-adapter",
    to: "/docs/data-connectors/massive",
  },
  {
    from: "/docs/adapters/massive-adapter",
    to: "/docs/data-connectors/massive",
  },
  { from: "/docs/data-bridges/overview", to: "/docs/data-connectors/overview" },
  { from: "/docs/data-bridges/binance", to: "/docs/data-connectors/binance" },
  { from: "/docs/data-bridges/bybit", to: "/docs/data-connectors/bybit" },
  { from: "/docs/data-bridges/okx", to: "/docs/data-connectors/okx" },
  { from: "/docs/data-bridges/coingecko", to: "/docs/data-connectors/coingecko" },
  { from: "/docs/data-bridges/kraken", to: "/docs/data-connectors/kraken" },
  { from: "/docs/data-bridges/kucoin", to: "/docs/data-connectors/kucoin" },
  { from: "/docs/data-bridges/coinbase", to: "/docs/data-connectors/coinbase" },
  { from: "/docs/data-bridges/gate", to: "/docs/data-connectors/gate" },
  { from: "/docs/data-bridges/eodhd", to: "/docs/data-connectors/eodhd" },
  { from: "/docs/data-bridges/polygon", to: "/docs/data-connectors/massive" },
  { from: "/docs/data-bridges/massive", to: "/docs/data-connectors/massive" },
  {
    from: "/docs/data-bridges/partner-equities",
    to: "/docs/data-connectors/massive",
  },
  {
    from: "/docs/data-connectors/partner-equities",
    to: "/docs/data-connectors/massive",
  },
  { from: "/partner-equities-example", to: "/massive-example" },
  { from: "/docs/api-reference/data-adapters", to: "/docs/api-reference/data-connectors" },
];
