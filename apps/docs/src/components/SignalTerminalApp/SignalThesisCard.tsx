import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import {
  formatConfluence,
  formatSignalTime,
  getConfluenceForSymbol,
  getConfluenceLabel,
  getLastSignalForSymbol,
} from "./mockSignals";
import styles from "./signalTerminalApp.module.css";

type SignalThesisCardProps = {
  symbol: string;
  pairLabel: string;
  livePrice?: number;
};

export default function SignalThesisCard({ symbol, pairLabel, livePrice }: SignalThesisCardProps) {
  const confluence = getConfluenceForSymbol(symbol);
  const lastSignal = getLastSignalForSymbol(symbol);
  const label = getConfluenceLabel(confluence);
  const tone =
    confluence >= 55 ? styles.thesisBull : confluence <= -55 ? styles.thesisBear : styles.thesisNeutral;

  return (
    <section className={styles.thesisCard} aria-label="Signal thesis">
      <div className={styles.thesisTop}>
        <div>
          <p className={styles.thesisEyebrow}>Active thesis · {pairLabel}</p>
          <div className={styles.thesisScoreRow}>
            <span className={[styles.thesisScore, tone].join(" ")}>{formatConfluence(confluence)}</span>
            <span className={styles.thesisLabel}>{label}</span>
          </div>
        </div>
        {livePrice !== undefined ? (
          <div className={styles.thesisPrice}>
            <span className={styles.marketLabel}>Live</span>
            <strong>${formatPrice(livePrice)}</strong>
          </div>
        ) : null}
      </div>

      {lastSignal ? (
        <>
          <p className={styles.thesisReasoning}>{lastSignal.reasoning}</p>
          <div className={styles.thesisMeta}>
            <span>
              Latest: <strong>{lastSignal.side === "buy" ? "Buy" : "Sell"}</strong> · {lastSignal.strategy}
            </span>
            <span>{formatSignalTime(lastSignal.timestamp)}</span>
          </div>
        </>
      ) : (
        <p className={styles.thesisReasoning}>
          No actionable signal in the last 6 hours. Chart still shows context indicators — this is the
          “hold / wait” state most investors see most of the time.
        </p>
      )}
    </section>
  );
}
