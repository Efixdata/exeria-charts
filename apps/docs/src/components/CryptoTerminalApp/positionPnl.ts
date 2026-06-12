import type { OpenPosition } from "./mockMarketData";

export type UnrealizedPnl = {
  usd: number;
  percent: number;
};

export function computeUnrealizedPnl(
  position: OpenPosition,
  markPrice: number,
): UnrealizedPnl | null {
  if (!Number.isFinite(markPrice) || markPrice <= 0) {
    return null;
  }

  const notional = position.entryPrice * position.size;
  if (notional <= 0) {
    return null;
  }

  const usd =
    position.side === "buy"
      ? (markPrice - position.entryPrice) * position.size
      : (position.entryPrice - markPrice) * position.size;
  const percent = (usd / notional) * 100;

  return { usd, percent };
}

export function sumUnrealizedPnl(
  positions: OpenPosition[],
  markPrices: Record<string, number>,
): number {
  return positions.reduce((total, position) => {
    const mark = markPrices[position.symbol];
    if (mark === undefined) {
      return total;
    }
    const pnl = computeUnrealizedPnl(position, mark);
    return total + (pnl?.usd ?? 0);
  }, 0);
}
