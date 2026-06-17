import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import type { SignalEvent } from "./mockSignals";
import { formatSignalAge } from "./mockSignals";
import styles from "./signalTerminalApp.module.css";

type SignalFeedPanelProps = {
  symbol: string;
  events: SignalEvent[];
};

export default function SignalFeedPanel({ symbol, events }: SignalFeedPanelProps) {
  const pairLabel = symbol.replace("USDT", "/USDT");
  const latest = events[0];

  return (
    <aside className={styles.panel}>
      <div className={styles.panelHeaderRow}>
        <span className={styles.panelHeader}>Signals</span>
        <span className={styles.panelMeta}>{pairLabel}</span>
      </div>

      {latest ? (
        <div className={styles.signalHero}>
          <span
            className={[
              styles.signalHeroSide,
              latest.side === "buy" ? styles.changeUp : styles.changeDown,
            ].join(" ")}
          >
            {latest.side === "buy" ? "Buy" : "Sell"}
          </span>
          <p className={styles.signalHeroText}>{latest.reasoning}</p>
          <span className={styles.signalHeroMeta}>
            {latest.strategy} · ${formatPrice(latest.price)} · {formatSignalAge(latest.timestamp)}
          </span>
        </div>
      ) : (
        <p className={styles.emptyState}>No active signal — holding pattern.</p>
      )}

      {events.length > 1 ? (
        <ul className={styles.feedList}>
          {events.slice(1).map((event) => (
            <li
              key={event.id}
              className={[
                styles.feedRow,
                event.side === "buy" ? styles.feedRowBuy : styles.feedRowSell,
              ].join(" ")}
            >
              <span className={styles.feedRowSide}>{event.side === "buy" ? "Buy" : "Sell"}</span>
              <span className={styles.feedRowStrategy}>{event.strategy}</span>
              <span className={styles.feedRowMeta}>{formatSignalAge(event.timestamp)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}
