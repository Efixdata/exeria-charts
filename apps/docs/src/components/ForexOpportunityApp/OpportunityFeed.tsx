import type { ArbSignalRecord } from "@efixdata/exeria-chart";
import SignalSparkline from "../SignalTerminalApp/SignalSparkline";
import { formatOpportunityAge } from "./opportunityCatalog";
import styles from "./forexOpportunityApp.module.css";

type OpportunityFeedProps = {
  opportunities: ArbSignalRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const CATEGORY_LABELS: Record<ArbSignalRecord["category"], string> = {
  arb: "Arb",
  rare: "Rare",
  signal: "Signal",
  event: "News",
};

export default function OpportunityFeed({
  opportunities,
  selectedId,
  onSelect,
}: OpportunityFeedProps) {
  if (opportunities.length === 0) {
    return (
      <div className={styles.feedPanel} data-tour="opportunity-feed">
        <p className={styles.feedEmpty}>No opportunities match this filter.</p>
      </div>
    );
  }

  return (
    <div className={styles.feedPanel} data-tour="opportunity-feed">
      <ul className={styles.feedList}>
        {opportunities.map((item) => {
          const active = item.id === selectedId;
          const spark = item.sparkline ?? [];
          const sparkPrice = spark.at(-1) ?? 0;

          return (
            <li key={item.id}>
              <button
                type="button"
                className={[styles.feedItem, active ? styles.feedItemActive : undefined]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(item.id)}
                aria-pressed={active}
              >
                <div className={styles.feedItemTop}>
                  <span className={styles.feedCategory}>{CATEGORY_LABELS[item.category]}</span>
                  <span className={styles.feedEdge}>{item.edgeLabel}</span>
                </div>
                <div className={styles.feedTitleRow}>
                  <strong className={styles.feedTitle}>{item.title}</strong>
                  {spark.length > 1 ? (
                    <SignalSparkline
                      points={spark}
                      signalPrice={sparkPrice}
                      side={item.category === "signal" ? "buy" : "sell"}
                      smooth={false}
                    />
                  ) : null}
                </div>
                <p className={styles.feedPair}>
                  {item.pair} · {item.chartScene.timeframe.toUpperCase()}
                </p>
                <div className={styles.feedMeta}>
                  <span>Score {item.unusualScore}</span>
                  <span>{formatOpportunityAge(item.ageMinutes)}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
