import { formatChangePercent, formatCompactUsd, formatPrice } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type StatsRibbonProps = {
  pair: string;
  price?: number | undefined;
  bid?: number | undefined;
  ask?: number | undefined;
  changePercent?: number | undefined;
  high24h?: number | undefined;
  low24h?: number | undefined;
  volumeQuote?: number | undefined;
  spreadBps?: number | undefined;
  loading?: boolean | undefined;
};

export default function StatsRibbon({
  pair,
  price,
  bid,
  ask,
  changePercent,
  high24h,
  low24h,
  volumeQuote,
  spreadBps,
  loading,
}: StatsRibbonProps) {
  const positive = (changePercent ?? 0) >= 0;

  return (
    <section className={styles.statsRibbon} aria-label="Market summary">
      <div className={styles.statsPrimary}>
        <h1 className={styles.statsPair}>{pair}</h1>
        {price !== undefined ? (
          <span className={styles.statsPrice}>${formatPrice(price)}</span>
        ) : (
          <span className={styles.statsPriceMuted}>{loading ? "Loading…" : "—"}</span>
        )}
        {changePercent !== undefined ? (
          <span className={positive ? styles.changeUp : styles.changeDown}>
            {formatChangePercent(changePercent)}
          </span>
        ) : null}
        <span className={styles.statsSource}>24h · Binance ticker</span>
      </div>

      <div className={styles.statsGrid}>
        <div>
          <span className={styles.statsLabel}>Bid</span>
          <strong className={styles.bidPrice}>
            {bid !== undefined ? `$${formatPrice(bid)}` : "—"}
          </strong>
        </div>
        <div>
          <span className={styles.statsLabel}>Ask</span>
          <strong className={styles.askPrice}>
            {ask !== undefined ? `$${formatPrice(ask)}` : "—"}
          </strong>
        </div>
        <div>
          <span className={styles.statsLabel}>24h High</span>
          <strong>{high24h !== undefined ? `$${formatPrice(high24h)}` : "—"}</strong>
        </div>
        <div>
          <span className={styles.statsLabel}>24h Low</span>
          <strong>{low24h !== undefined ? `$${formatPrice(low24h)}` : "—"}</strong>
        </div>
        <div>
          <span className={styles.statsLabel}>24h Volume</span>
          <strong>{volumeQuote !== undefined ? formatCompactUsd(volumeQuote) : "—"}</strong>
        </div>
        <div>
          <span className={styles.statsLabel}>Spread</span>
          <strong>{spreadBps !== undefined ? `${spreadBps.toFixed(1)} bps` : "—"}</strong>
        </div>
      </div>
    </section>
  );
}
