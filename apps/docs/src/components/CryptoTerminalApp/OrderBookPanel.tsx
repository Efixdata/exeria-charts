import type { OrderBookLevel } from "./mockMarketData";
import { formatPrice, formatSize } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type OrderBookPanelProps = {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadBps: number;
};

function DepthRow({
  level,
  side,
  maxTotal,
}: {
  level: OrderBookLevel;
  side: "bid" | "ask";
  maxTotal: number;
}) {
  const depth = Math.min(100, (level.total / maxTotal) * 100);

  return (
    <div className={styles.depthRow}>
      <div
        className={side === "bid" ? styles.depthFillBid : styles.depthFillAsk}
        style={{ width: `${depth}%` }}
      />
      <span className={side === "bid" ? styles.depthPriceBid : styles.depthPriceAsk}>
        {formatPrice(level.price)}
      </span>
      <span className={styles.depthSize}>{formatSize(level.size)}</span>
    </div>
  );
}

export default function OrderBookPanel({
  bids,
  asks,
  spread,
  spreadBps,
}: OrderBookPanelProps) {
  const maxTotal = Math.max(bids.at(-1)?.total ?? 1, asks.at(-1)?.total ?? 1);

  return (
    <div className={styles.bookPanel}>
      <div className={styles.bookSpread}>
        <span>Spread</span>
        <strong>
          {formatPrice(spread)} · {spreadBps.toFixed(1)} bps
        </strong>
      </div>
      <div className={styles.bookColumns}>
        <div>
          <div className={styles.bookHeader}>Bids</div>
          {bids.slice(0, 10).map((level) => (
            <DepthRow key={`bid-${level.price}`} level={level} side="bid" maxTotal={maxTotal} />
          ))}
        </div>
        <div>
          <div className={styles.bookHeader}>Asks</div>
          {asks.slice(0, 10).map((level) => (
            <DepthRow key={`ask-${level.price}`} level={level} side="ask" maxTotal={maxTotal} />
          ))}
        </div>
      </div>
    </div>
  );
}
