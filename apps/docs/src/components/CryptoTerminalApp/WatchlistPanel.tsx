import type { WatchlistSymbol } from "./constants";
import { buildSparklinePoints } from "./mockMarketData";
import type { SparklineSeriesMap } from "./useSparklineSeries";
import type { WatchlistStat } from "./useWatchlistStats";
import { formatChangePercent, formatPrice } from "./terminalFormat";
import Sparkline from "./Sparkline";
import styles from "./cryptoTerminalApp.module.css";

type WatchlistPanelProps = {
  symbols: WatchlistSymbol[];
  selectedSymbol: string;
  stats: Record<string, WatchlistStat>;
  sparklines: SparklineSeriesMap;
  livePrice?: number;
  onSelect: (symbolId: string) => void;
};

export default function WatchlistPanel({
  symbols,
  selectedSymbol,
  stats,
  sparklines,
  livePrice,
  onSelect,
}: WatchlistPanelProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <span className={styles.panelHeader}>Markets</span>
        <span className={styles.panelMeta}>24h</span>
      </div>
      <ul className={styles.watchlist}>
        {symbols.map((item) => {
          const stat = stats[item.id];
          const price =
            item.id === selectedSymbol && livePrice !== undefined
              ? livePrice
              : stat?.price;
          const changePercent = stat?.changePercent ?? 0;
          const positive = changePercent >= 0;

          return (
            <li key={item.id}>
              <button
                type="button"
                className={[
                  styles.watchlistItem,
                  positive ? styles.watchlistItemUp : styles.watchlistItemDown,
                  selectedSymbol === item.id ? styles.watchlistItemActive : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(item.id)}
              >
                <div className={styles.watchlistTop}>
                  <div className={styles.watchlistIdentity}>
                    <span className={styles.watchlistSymbol}>{item.label}</span>
                    <span className={styles.watchlistPair}>{item.pair}</span>
                  </div>

                  <div className={styles.watchlistQuote}>
                    <span className={styles.watchlistPrice}>
                      {price !== undefined ? `$${formatPrice(price)}` : "—"}
                    </span>
                    <span
                      className={[
                        styles.watchlistChange,
                        positive ? styles.watchlistChangeUp : styles.watchlistChangeDown,
                      ].join(" ")}
                    >
                      {stat ? formatChangePercent(changePercent) : "—"}
                    </span>
                  </div>
                </div>

                <div className={styles.watchlistSparkSlot}>
                  <Sparkline
                    points={
                      sparklines[item.id]?.length
                        ? sparklines[item.id]!
                        : buildSparklinePoints(changePercent, item.id)
                    }
                    positive={positive}
                  />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
