import type { CSSProperties } from "react";
import type { RebalanceSuggestion } from "./wealthAnalytics";
import styles from "./fintechWealthApp.module.css";

type RebalanceCardProps = {
  suggestion: RebalanceSuggestion | null;
  loading: boolean;
};

export default function RebalanceCard({ suggestion, loading }: RebalanceCardProps) {
  if (loading) {
    return <div className={styles.rebalanceCard} data-loading="true" aria-hidden />;
  }

  if (!suggestion) {
    return (
      <section className={styles.rebalanceCard} aria-label="Rebalance suggestion">
        <div className={styles.rebalanceHeader}>
          <h2 className={styles.sectionTitle}>Rebalance</h2>
          <span className={styles.sectionHint}>On target</span>
        </div>
        <p className={styles.rebalanceLead}>Your live weights are within 3% of the model portfolio.</p>
      </section>
    );
  }

  const actionLabel = suggestion.action === "trim" ? "Consider trimming" : "Consider adding to";

  return (
    <section
      className={styles.rebalanceCard}
      aria-label="Rebalance suggestion"
      style={{ "--rebalance-color": suggestion.color } as CSSProperties}
    >
      <div className={styles.rebalanceHeader}>
        <h2 className={styles.sectionTitle}>Rebalance</h2>
        <span className={styles.sectionHint}>
          {suggestion.driftPercent > 0 ? "Overweight" : "Underweight"}
        </span>
      </div>
      <p className={styles.rebalanceLead}>
        {actionLabel} <strong>{suggestion.assetLabel}</strong> — drift{" "}
        {Math.abs(suggestion.driftPercent).toFixed(1)} pts vs target.
      </p>
      <div className={styles.rebalanceBars}>
        <div className={styles.rebalanceBarRow}>
          <span>Current</span>
          <div className={styles.rebalanceTrack}>
            <span
              className={styles.rebalanceFill}
              data-variant="current"
              style={{ width: `${Math.min(100, suggestion.currentPercent)}%` }}
            />
          </div>
          <strong>{suggestion.currentPercent.toFixed(0)}%</strong>
        </div>
        <div className={styles.rebalanceBarRow}>
          <span>Target</span>
          <div className={styles.rebalanceTrack}>
            <span
              className={styles.rebalanceFill}
              data-variant="target"
              style={{ width: `${Math.min(100, suggestion.targetPercent)}%` }}
            />
          </div>
          <strong>{suggestion.targetPercent.toFixed(0)}%</strong>
        </div>
      </div>
    </section>
  );
}
