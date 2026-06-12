import { useMemo } from "react";
import type { WatchlistSymbol } from "../CryptoTerminalApp/constants";
import type { SparklineSeriesMap } from "../CryptoTerminalApp/useSparklineSeries";
import type { WatchlistStat } from "../CryptoTerminalApp/useWatchlistStats";
import { formatChangePercent, formatPrice } from "../CryptoTerminalApp/terminalFormat";
import { getConfluenceForSymbol, getLastSignalForSymbol } from "./mockSignals";
import styles from "./signalTerminalApp.module.css";

type ScreenerPanelProps = {
  symbols: WatchlistSymbol[];
  selectedSymbol: string;
  stats: Record<string, WatchlistStat>;
  sparklines: SparklineSeriesMap;
  livePrice?: number;
  onSelect: (symbolId: string) => void;
};

function sortSymbols(symbols: WatchlistSymbol[]): WatchlistSymbol[] {
  return [...symbols].sort(
    (a, b) => Math.abs(getConfluenceForSymbol(b.id)) - Math.abs(getConfluenceForSymbol(a.id)),
  );
}

export default function ScreenerPanel({
  symbols,
  selectedSymbol,
  stats,
  livePrice,
  onSelect,
}: ScreenerPanelProps) {
  const sortedSymbols = useMemo(() => sortSymbols(symbols), [symbols]);

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <span className={styles.panelHeader}>Markets</span>
      </div>
      <ul className={styles.screenerList}>
        {sortedSymbols.map((item) => {
          const stat = stats[item.id];
          const price =
            item.id === selectedSymbol && livePrice !== undefined ? livePrice : stat?.price;
          const changePercent = stat?.changePercent ?? 0;
          const positive = changePercent >= 0;
          const lastSignal = getLastSignalForSymbol(item.id);

          return (
            <li key={item.id}>
              <button
                type="button"
                className={[
                  styles.screenerItem,
                  selectedSymbol === item.id ? styles.screenerItemActive : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onSelect(item.id)}
              >
                <span className={styles.screenerSymbol}>{item.label}</span>
                <span className={styles.screenerPrice}>
                  {price !== undefined ? `$${formatPrice(price)}` : "—"}
                </span>
                <span
                  className={[
                    styles.screenerChange,
                    positive ? styles.changeUp : styles.changeDown,
                  ].join(" ")}
                >
                  {stat ? formatChangePercent(changePercent) : "—"}
                </span>
                <span
                  className={[
                    styles.signalTag,
                    lastSignal
                      ? lastSignal.side === "buy"
                        ? styles.signalTagBuy
                        : styles.signalTagSell
                      : styles.signalTagHold,
                  ].join(" ")}
                >
                  {lastSignal ? (lastSignal.side === "buy" ? "Buy" : "Sell") : "Hold"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
