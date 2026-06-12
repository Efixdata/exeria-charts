import type { FintechMarketId } from "./marketPresets";
import type { HoldingRow } from "./portfolioModel";

export type RebalanceSuggestion = {
  assetId: string;
  assetLabel: string;
  color: string;
  currentPercent: number;
  targetPercent: number;
  driftPercent: number;
  action: "trim" | "add";
};

export type SectorWeight = {
  sector: string;
  weight: number;
  color: string;
};

export type ActivityEventType = "dividend" | "buy" | "deposit";

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  title: string;
  subtitle: string;
  amountEur: number;
  timestamp: number;
};

const SECTOR_COLORS = ["#FF2D9A", "#9B59FF", "#3B82F6", "#22D3EE", "#F97316", "#A78BFA"];

export function computeRebalanceSuggestions(
  holdings: HoldingRow[],
  driftThreshold = 3,
): RebalanceSuggestion | null {
  if (holdings.length === 0) {
    return null;
  }

  const suggestions = holdings.map((row) => {
    const currentPercent = row.currentWeight * 100;
    const targetPercent = row.asset.allocation * 100;
    const driftPercent = currentPercent - targetPercent;

    return {
      assetId: row.asset.id,
      assetLabel: row.asset.label,
      color: row.asset.color,
      currentPercent,
      targetPercent,
      driftPercent,
      action: driftPercent > 0 ? ("trim" as const) : ("add" as const),
    };
  });

  const sorted = [...suggestions].sort((a, b) => Math.abs(b.driftPercent) - Math.abs(a.driftPercent));
  const top = sorted[0];

  if (!top || Math.abs(top.driftPercent) < driftThreshold) {
    return null;
  }

  return top;
}

export function computeSectorBreakdown(holdings: HoldingRow[]): SectorWeight[] {
  if (holdings.length === 0) {
    return [];
  }

  const totals = new Map<string, number>();

  for (const row of holdings) {
    totals.set(row.asset.sector, (totals.get(row.asset.sector) ?? 0) + row.holdingValueEur);
  }

  const investedTotal = holdings.reduce((sum, row) => sum + row.holdingValueEur, 0) || 1;

  return [...totals.entries()]
    .map(([sector, valueEur], index) => ({
      sector,
      weight: valueEur / investedTotal,
      color: SECTOR_COLORS[index % SECTOR_COLORS.length]!,
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function computeGoalLinePercent(
  savingsGoalEur: number,
  periodStartValueEur: number,
): number | null {
  if (periodStartValueEur <= 0 || savingsGoalEur <= periodStartValueEur) {
    return null;
  }

  const percent = ((savingsGoalEur / periodStartValueEur) - 1) * 100;
  return Number.isFinite(percent) ? percent : null;
}

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export function buildActivityFeed(
  holdings: HoldingRow[],
  marketId: FintechMarketId,
  cashEur: number,
): ActivityEvent[] {
  if (holdings.length === 0) {
    return [];
  }

  const topHolding = [...holdings].sort((a, b) => b.holdingValueEur - a.holdingValueEur)[0]!;
  const dividendSymbol = marketId === "equities" ? "VWCE" : topHolding.asset.symbol.replace("USDT", "");
  const dividendAmount =
    marketId === "equities"
      ? Math.round(topHolding.holdingValueEur * 0.0012)
      : Math.round(topHolding.holdingValueEur * 0.0008);

  return [
    {
      id: "deposit",
      type: "deposit",
      title: "Cash deposit",
      subtitle: "Standing order",
      amountEur: Math.round(cashEur * 0.18),
      timestamp: daysAgo(2),
    },
    {
      id: "buy",
      type: "buy",
      title: `Buy ${topHolding.asset.label}`,
      subtitle: marketId === "equities" ? "Market order" : "Recurring buy",
      amountEur: Math.round(topHolding.holdingValueEur * 0.06),
      timestamp: daysAgo(5),
    },
    {
      id: "dividend",
      type: "dividend",
      title: `${dividendSymbol} distribution`,
      subtitle: "Paid to cash",
      amountEur: Math.max(12, dividendAmount),
      timestamp: daysAgo(11),
    },
    {
      id: "buy-2",
      type: "buy",
      title: `Buy ${holdings[1]?.asset.label ?? topHolding.asset.label}`,
      subtitle: "Limit filled",
      amountEur: Math.round((holdings[1]?.holdingValueEur ?? topHolding.holdingValueEur) * 0.04),
      timestamp: daysAgo(18),
    },
  ];
}
