import type { AssetPerformance } from "./fintechCompareChartSetup";
import type { FintechMarketId } from "./marketPresets";

export type PortfolioPosition = {
  assetId: string;
  quantity: number;
};

export type PortfolioModel = {
  cashEur: number;
  eurPerUsd: number;
  positions: PortfolioPosition[];
};

export const PORTFOLIO_MODELS: Record<FintechMarketId, PortfolioModel> = {
  crypto: {
    cashEur: 2_480,
    eurPerUsd: 0.92,
    positions: [
      { assetId: "btc", quantity: 0.142 },
      { assetId: "eth", quantity: 2.15 },
      { assetId: "sol", quantity: 24.5 },
    ],
  },
  equities: {
    cashEur: 2_840,
    eurPerUsd: 0.92,
    positions: [
      { assetId: "aapl", quantity: 48 },
      { assetId: "vwce", quantity: 72 },
      { assetId: "spy", quantity: 9 },
    ],
  },
};

export type HoldingRow = AssetPerformance & {
  quantity: number;
  holdingValueEur: number;
  periodChangeEur: number;
  currentWeight: number;
};

export type PortfolioSummary = {
  cashEur: number;
  investedEur: number;
  totalValueEur: number;
  periodStartValueEur: number;
  changeAmountEur: number;
  changePercent: number;
};

function priceToEur(priceUsd: number, eurPerUsd: number): number {
  return priceUsd * eurPerUsd;
}

function readQuantity(model: PortfolioModel, assetId: string): number {
  return model.positions.find((entry) => entry.assetId === assetId)?.quantity ?? 0;
}

export function buildHoldings(
  performance: AssetPerformance[],
  marketId: FintechMarketId,
): HoldingRow[] {
  const model = PORTFOLIO_MODELS[marketId];

  const rows = performance.map((row) => {
    const quantity = readQuantity(model, row.asset.id);
    const holdingValueEur = priceToEur(row.lastClose * quantity, model.eurPerUsd);
    const startValueEur = priceToEur(row.firstClose * quantity, model.eurPerUsd);

    return {
      ...row,
      quantity,
      holdingValueEur,
      periodChangeEur: holdingValueEur - startValueEur,
      currentWeight: 0,
    };
  });

  const investedTotal = rows.reduce((sum, row) => sum + row.holdingValueEur, 0);

  return rows.map((row) => ({
    ...row,
    currentWeight: investedTotal > 0 ? row.holdingValueEur / investedTotal : 0,
  }));
}

export function computePortfolioSummary(
  performance: AssetPerformance[],
  marketId: FintechMarketId,
): PortfolioSummary {
  const model = PORTFOLIO_MODELS[marketId];

  if (performance.length === 0) {
    return {
      cashEur: model.cashEur,
      investedEur: 0,
      totalValueEur: model.cashEur,
      periodStartValueEur: model.cashEur,
      changeAmountEur: 0,
      changePercent: 0,
    };
  }

  const holdings = buildHoldings(performance, marketId);

  const investedEur = holdings.reduce((sum, row) => sum + row.holdingValueEur, 0);
  const investedStartEur = holdings.reduce(
    (sum, row) => sum + priceToEur(row.firstClose * row.quantity, model.eurPerUsd),
    0,
  );

  const totalValueEur = model.cashEur + investedEur;
  const totalStartEur = model.cashEur + investedStartEur;
  const changeAmountEur = totalValueEur - totalStartEur;
  const changePercent = totalStartEur > 0 ? (changeAmountEur / totalStartEur) * 100 : 0;

  return {
    cashEur: model.cashEur,
    investedEur,
    totalValueEur,
    periodStartValueEur: totalStartEur,
    changeAmountEur,
    changePercent,
  };
}

export function formatHoldingQuantity(
  quantity: number,
  marketId: FintechMarketId,
  symbol: string,
): string {
  if (marketId === "crypto") {
    if (symbol.startsWith("BTC")) {
      return `${quantity.toFixed(3)} BTC`;
    }

    return `${quantity.toFixed(2)} ${symbol.replace("USDT", "")}`;
  }

  return `${quantity.toFixed(0)} shares`;
}
