export type PositionRiskMode = "AMOUNT" | "PERCENT";

export interface PositionPnlInput {
  direction: "LONG" | "SHORT";
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  accountSize: number;
  riskMode: PositionRiskMode;
  riskAmount: number;
  riskPercent: number;
  quantityOverride?: number | null;
  leverage?: number;
}

export interface PositionPnlSummary {
  quantity: number;
  riskBudget: number;
  /** Signed P&L if price reaches target. */
  pnlAtTarget: number;
  /** Signed P&L if price reaches stop (positive when stop locks in profit). */
  pnlAtStop: number;
  /** @deprecated Use `pnlAtTarget`; kept for settings dialog. */
  profitAtTarget: number;
  /** Loss magnitude at stop only (0 when stop is above entry on a long). */
  lossAtStop: number;
  balanceAtTarget: number;
  balanceAtStop: number;
  riskRewardRatio: number | null;
}

function readPositive(value: unknown, fallback: number): number {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function computePositionPnl(input: PositionPnlInput): PositionPnlSummary {
  const entryPrice = input.entryPrice;
  const stopPrice = input.stopPrice;
  const targetPrice = input.targetPrice;
  const accountSize = readPositive(input.accountSize, 10000);
  const leverage = readPositive(input.leverage, 1);
  const riskPerUnit = Math.abs(entryPrice - stopPrice);

  const riskBudget =
    input.riskMode === "PERCENT"
      ? (accountSize * readPositive(input.riskPercent, 1)) / 100
      : readPositive(input.riskAmount, 100);

  const qtyFromRisk = riskPerUnit > 0 ? riskBudget / riskPerUnit : 0;
  const qtyFromLeverage = entryPrice > 0 ? (accountSize * leverage) / entryPrice : 0;
  const autoQuantity = riskPerUnit > 0 ? Math.min(qtyFromRisk, qtyFromLeverage) : 0;

  const override = input.quantityOverride;
  const quantity =
    typeof override === "number" && Number.isFinite(override) && override > 0
      ? override
      : autoQuantity;

  const isLong = input.direction !== "SHORT";
  const pnlAtTarget = isLong
    ? (targetPrice - entryPrice) * quantity
    : (entryPrice - targetPrice) * quantity;
  const pnlAtStop = isLong
    ? (stopPrice - entryPrice) * quantity
    : (entryPrice - stopPrice) * quantity;

  const safeTarget = Number.isFinite(pnlAtTarget) ? pnlAtTarget : 0;
  const safeStop = Number.isFinite(pnlAtStop) ? pnlAtStop : 0;
  const lossAtStop = Math.max(-safeStop, 0);

  const risk = Math.abs(entryPrice - stopPrice);
  const reward = Math.abs(targetPrice - entryPrice);
  const riskRewardRatio = risk > 0 ? reward / risk : null;

  return {
    quantity,
    riskBudget,
    pnlAtTarget: safeTarget,
    pnlAtStop: safeStop,
    profitAtTarget: safeTarget,
    lossAtStop,
    balanceAtTarget: accountSize + safeTarget,
    balanceAtStop: accountSize + safeStop,
    riskRewardRatio,
  };
}

export function formatPnlCurrency(value: number, decimals = 2): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}$${Math.abs(value).toFixed(decimals)}`;
}
