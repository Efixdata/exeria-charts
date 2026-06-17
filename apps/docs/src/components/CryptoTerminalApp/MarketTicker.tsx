import { TICKER_HEADLINES } from "./constants";
import styles from "./cryptoTerminalApp.module.css";

export default function MarketTicker() {
  const items = [...TICKER_HEADLINES, ...TICKER_HEADLINES];

  return (
    <div className={styles.tickerTrack} aria-hidden>
      <div className={styles.tickerInner}>
        {items.map((headline, index) => (
          <span key={`${headline}-${index}`} className={styles.tickerItem}>
            {headline}
          </span>
        ))}
      </div>
    </div>
  );
}
