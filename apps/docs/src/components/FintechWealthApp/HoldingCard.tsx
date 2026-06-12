import type { CSSProperties } from "react";
import FintechSparkline from "./FintechSparkline";
import { formatDisplaySymbol, formatPercent, formatSharePercent } from "./formatters";
import type { FintechMarketId } from "./marketPresets";
import { formatHoldingQuantity, type HoldingRow } from "./portfolioModel";
import styles from "./fintechWealthApp.module.css";

type HoldingCardProps = {
  row: HoldingRow;
  marketId: FintechMarketId;
  focused: boolean;
  onSelect: () => void;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function HoldingCard({ row, marketId, focused, onSelect }: HoldingCardProps) {
  const targetWeight = Number.isFinite(row.asset.allocation)
    ? Math.round(row.asset.allocation * 100)
    : null;
  const actualWeight = Number.isFinite(row.currentWeight)
    ? Math.round(row.currentWeight * 100)
    : null;

  return (
    <button
      type="button"
      className={styles.holdingCard}
      data-focused={focused ? "true" : "false"}
      onClick={onSelect}
      style={{ "--holding-color": row.asset.color } as CSSProperties}
    >
      <div className={styles.holdingCardMain}>
        <div className={styles.holdingIdentity}>
          <span className={styles.holdingDot} style={{ color: row.asset.color }} />
          <div>
            <p className={styles.holdingName}>{row.asset.label}</p>
            <p className={styles.holdingSymbol}>
              {formatDisplaySymbol(row.asset, marketId)} ·{" "}
              {formatHoldingQuantity(row.quantity, marketId, row.asset.symbol)}
            </p>
          </div>
        </div>

        <FintechSparkline
          points={row.sparkline}
          color={row.asset.color}
          positive={row.changePercent >= 0}
        />
      </div>

      <div className={styles.holdingCardMeta}>
        <div className={styles.holdingMetaPrimary}>
          <span
            className={styles.holdingChange}
            data-tone={row.changePercent >= 0 ? "up" : "down"}
          >
            {formatPercent(row.changePercent)}
          </span>
          <span className={styles.holdingWeight}>
            {actualWeight == null ? "—" : formatSharePercent(actualWeight)}{" "}
            <span aria-hidden>·</span> target{" "}
            {targetWeight == null ? "—" : formatSharePercent(targetWeight)}
          </span>
        </div>
        <span className={styles.holdingValue}>{formatCurrency(row.holdingValueEur)}</span>
      </div>
    </button>
  );
}
