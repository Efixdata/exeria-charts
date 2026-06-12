import type { TapeTrade } from "./binancePublicStreams";
import { formatPrice, formatSize } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type TradesTapeProps = {
  trades: TapeTrade[];
};

export default function TradesTape({ trades }: TradesTapeProps) {
  if (trades.length === 0) {
    return <p className={styles.emptyState}>Waiting for aggTrade prints…</p>;
  }

  return (
    <div className={styles.tradesPanel}>
      <div className={styles.tradesHeader}>
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>
      <ul className={styles.tradesList}>
        {trades.map((trade) => (
          <li key={trade.id} className={styles.tradesRow}>
            <span className={trade.side === "buy" ? styles.tradeBuy : styles.tradeSell}>
              {formatPrice(trade.price)}
            </span>
            <span>{formatSize(trade.size)}</span>
            <span className={styles.tradeTime}>
              {new Date(trade.time).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
