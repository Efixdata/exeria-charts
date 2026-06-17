import FintechSparkline from "./FintechSparkline";
import type { WatchlistItem } from "./constants";
import { formatPercent, readSparklineChange } from "./formatters";
import type { FintechMarketId } from "./marketPresets";
import type { SparklineSeriesMap } from "./useWatchlistSparklines";
import styles from "./fintechWealthApp.module.css";

type WatchlistStripProps = {
  items: WatchlistItem[];
  marketId: FintechMarketId;
  series: SparklineSeriesMap;
  loading: boolean;
};

export default function WatchlistStrip({ items, marketId, series, loading }: WatchlistStripProps) {
  return (
    <section className={styles.watchlistSection} aria-label="On your radar">
      <div className={styles.sectionHeading}>
        <h2 className={styles.sectionTitle}>On your radar</h2>
        <span className={styles.sectionHint}>Watchlist</span>
      </div>

      <div className={styles.watchlistRow}>
        {items.map((item) => {
          const points = (series[item.id] ?? []).filter((point) => Number.isFinite(point));
          const change = readSparklineChange(points);
          const hasSparkline = points.length >= 2;
          const showPlaceholder = loading && !hasSparkline;

          return (
            <article
              key={item.id}
              className={styles.watchlistCard}
              data-loading={showPlaceholder ? "true" : "false"}
            >
              <div className={styles.watchlistCardTop}>
                <span className={styles.watchlistDot} style={{ background: item.color }} />
                <div>
                  <p className={styles.watchlistName}>{item.label}</p>
                  <p className={styles.watchlistSymbol}>
                    {marketId === "equities" ? item.symbol : item.symbol.replace("USDT", "")}
                  </p>
                </div>
              </div>
              {showPlaceholder ? (
                <span className={styles.sparklinePlaceholder} aria-hidden />
              ) : (
                <FintechSparkline
                  points={points}
                  color={item.color}
                  positive={change == null ? true : change >= 0}
                  width={120}
                  height={34}
                />
              )}
              <p
                className={styles.watchlistChange}
                data-tone={change != null && change < 0 ? "down" : "up"}
                data-empty={change == null ? "true" : "false"}
              >
                {showPlaceholder || change == null ? "—" : formatPercent(change)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
