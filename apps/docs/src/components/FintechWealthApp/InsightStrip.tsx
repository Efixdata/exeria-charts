import { useMemo, type CSSProperties } from "react";
import type { HoldingRow } from "./portfolioModel";
import type { RebalanceSuggestion } from "./wealthAnalytics";
import styles from "./fintechWealthApp.module.css";

type InsightStripProps = {
  holdings: HoldingRow[];
  portfolioChangePercent: number;
  portfolioValueEur: number;
  savingsGoalEur: number;
  rebalanceSuggestion: RebalanceSuggestion | null;
  loading: boolean;
  balanceHidden?: boolean;
};

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InsightStrip({
  holdings,
  portfolioChangePercent,
  portfolioValueEur,
  savingsGoalEur,
  rebalanceSuggestion,
  loading,
  balanceHidden = false,
}: InsightStripProps) {
  const insights = useMemo(() => {
    if (holdings.length === 0) {
      return [];
    }

    const sorted = [...holdings].sort((a, b) => b.changePercent - a.changePercent);
    const best = sorted[0]!;
    const worst = sorted[sorted.length - 1]!;
    const goalProgress = Math.min(100, Math.round((portfolioValueEur / savingsGoalEur) * 100));
    const remainingEur = Math.max(0, savingsGoalEur - portfolioValueEur);

    const rebalanceInsight = rebalanceSuggestion
      ? {
          id: "rebalance",
          eyebrow: "Rebalance",
          title:
            rebalanceSuggestion.action === "trim"
              ? `Trim ${rebalanceSuggestion.assetLabel}`
              : `Add ${rebalanceSuggestion.assetLabel}`,
          body: `${Math.abs(rebalanceSuggestion.driftPercent).toFixed(1)} pts vs ${rebalanceSuggestion.targetPercent.toFixed(0)}% target`,
          tone: rebalanceSuggestion.action === "trim" ? "down" : "up",
          accent: rebalanceSuggestion.color,
        }
      : {
          id: "pulse",
          eyebrow: "Portfolio pulse",
          title: portfolioChangePercent >= 0 ? "Trending up" : "Pullback",
          body:
            worst.asset.id !== best.asset.id
              ? `${worst.asset.label} ${formatPercent(worst.changePercent)}`
              : "Balanced across holdings",
          tone: portfolioChangePercent >= 0 ? "up" : "down",
          accent: worst.asset.color,
        };

    return [
      {
        id: "best",
        eyebrow: "Top mover",
        title: best.asset.label,
        body: `${formatPercent(best.changePercent)} this period`,
        tone: best.changePercent >= 0 ? "up" : "down",
        accent: best.asset.color,
      },
      {
        id: "goal",
        eyebrow: "Savings goal",
        title: balanceHidden ? "Goal progress" : `${goalProgress}% funded`,
        body: balanceHidden
          ? "Hidden while balance is masked"
          : `${formatCurrency(remainingEur)} to reach ${formatCurrency(savingsGoalEur)}`,
        tone: "neutral",
        accent: "#9B59FF",
        progress: balanceHidden ? undefined : goalProgress,
      },
      rebalanceInsight,
    ] as const;
  }, [
    balanceHidden,
    holdings,
    portfolioChangePercent,
    portfolioValueEur,
    rebalanceSuggestion,
    savingsGoalEur,
  ]);

  if (loading && holdings.length === 0) {
    return (
      <div className={styles.insightStrip}>
        {[0, 1, 2].map((index) => (
          <div key={index} className={styles.insightCard} data-loading="true" aria-hidden />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.insightStrip} aria-label="Portfolio insights">
      {insights.map((insight) => (
        <article
          key={insight.id}
          className={styles.insightCard}
          style={{ "--insight-accent": insight.accent } as CSSProperties}
        >
          <span className={styles.insightEyebrow}>{insight.eyebrow}</span>
          <h3 className={styles.insightTitle}>{insight.title}</h3>
          <p className={styles.insightBody} data-tone={insight.tone}>
            {insight.body}
          </p>
          {"progress" in insight && insight.progress != null ? (
            <div className={styles.insightProgressTrack}>
              <span
                className={styles.insightProgressFill}
                style={{ width: `${insight.progress}%` }}
              />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
