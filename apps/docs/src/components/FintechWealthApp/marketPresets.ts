import type { FintechAsset, WatchlistItem } from "./constants";

export type FintechMarketId = "crypto" | "equities";

export type FintechMarketPreset = {
  id: FintechMarketId;
  label: string;
  shortLabel: string;
  assets: FintechAsset[];
  watchlist: WatchlistItem[];
  portfolioBaseEur: number;
  savingsGoalEur: number;
};

export const FINTECH_MARKET_PRESETS: Record<FintechMarketId, FintechMarketPreset> = {
  crypto: {
    id: "crypto",
    label: "Crypto",
    shortLabel: "Crypto",
    portfolioBaseEur: 24_850.32,
    savingsGoalEur: 30_000,
    assets: [
      {
        id: "btc",
        symbol: "BTCUSDT",
        label: "Bitcoin",
        color: "#FF2D9A",
        allocation: 0.5,
        sector: "Digital assets",
      },
      {
        id: "eth",
        symbol: "ETHUSDT",
        label: "Ethereum",
        color: "#9B59FF",
        allocation: 0.33,
        sector: "Digital assets",
      },
      {
        id: "sol",
        symbol: "SOLUSDT",
        label: "Solana",
        color: "#3B82F6",
        allocation: 0.17,
        sector: "Digital assets",
      },
    ],
    watchlist: [
      { id: "ADAUSDT", symbol: "ADAUSDT", label: "Cardano", color: "#22D3EE" },
      { id: "AVAXUSDT", symbol: "AVAXUSDT", label: "Avalanche", color: "#F97316" },
      { id: "LINKUSDT", symbol: "LINKUSDT", label: "Chainlink", color: "#A78BFA" },
    ],
  },
  equities: {
    id: "equities",
    label: "Equities",
    shortLabel: "Equities",
    portfolioBaseEur: 31_420.0,
    savingsGoalEur: 40_000,
    assets: [
      {
        id: "aapl",
        symbol: "AAPL",
        label: "Apple",
        color: "#FF2D9A",
        allocation: 0.42,
        sector: "US Technology",
      },
      {
        id: "vwce",
        symbol: "VWCE",
        label: "Vanguard",
        color: "#9B59FF",
        allocation: 0.38,
        sector: "Global ETF",
      },
      {
        id: "spy",
        symbol: "SPY",
        label: "S&P 500 ETF",
        color: "#3B82F6",
        allocation: 0.2,
        sector: "US Broad Market",
      },
    ],
    watchlist: [
      { id: "MSFT", symbol: "MSFT", label: "Microsoft", color: "#22D3EE" },
      { id: "NVDA", symbol: "NVDA", label: "Nvidia", color: "#F97316" },
      { id: "GOOGL", symbol: "GOOGL", label: "Alphabet", color: "#A78BFA" },
    ],
  },
};

export function getMarketPreset(marketId: FintechMarketId): FintechMarketPreset {
  return FINTECH_MARKET_PRESETS[marketId];
}
