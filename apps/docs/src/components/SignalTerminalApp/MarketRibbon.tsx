import { formatChangePercent } from "../CryptoTerminalApp/terminalFormat";
import { getMarketSnapshot } from "./marketContext";
import styles from "./signalTerminalApp.module.css";

export default function MarketRibbon() {
  const market = getMarketSnapshot();

  return (
    <div className={styles.marketRibbon} aria-label="Market overview">
      <div className={styles.marketStat}>
        <span className={styles.marketLabel}>BTC 24h</span>
        <span className={market.btcChange24h >= 0 ? styles.changeUp : styles.changeDown}>
          {formatChangePercent(market.btcChange24h)}
        </span>
      </div>
      <div className={styles.marketStat}>
        <span className={styles.marketLabel}>ETH 24h</span>
        <span className={market.ethChange24h >= 0 ? styles.changeUp : styles.changeDown}>
          {formatChangePercent(market.ethChange24h)}
        </span>
      </div>
      <div className={styles.marketStat}>
        <span className={styles.marketLabel}>Regime</span>
        <span>{market.regimeLabel}</span>
      </div>
      <div className={styles.marketStat}>
        <span className={styles.marketLabel}>Fear &amp; Greed</span>
        <span>
          {market.fearGreed} · {market.fearGreedLabel}
        </span>
      </div>
      <div className={styles.marketStat}>
        <span className={styles.marketLabel}>Active signals</span>
        <span>
          <span className={styles.changeUp}>{market.bullishCount} bull</span>
          {" · "}
          <span className={styles.changeDown}>{market.bearishCount} bear</span>
        </span>
      </div>
    </div>
  );
}
