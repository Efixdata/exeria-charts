import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import MarketPriceTicker from "./MarketPriceTicker";
import SignalDetailExpand from "./SignalDetailExpand";
import SignalMiniChart from "./SignalMiniChart";
import type { TimeframeId } from "./constants";
import type { ScreenerSignal } from "./signalCatalog";
import { formatSignalDate } from "./signalCatalog";
import styles from "./signalTerminalApp.module.css";

type SignalScreenerListProps = {
  signals: ScreenerSignal[];
  expandedId: string | null;
  marketPrices: Record<string, number>;
  timeframeId: TimeframeId;
  onToggle: (id: string) => void;
  onPriceTick: (symbol: string, price: number, timestamp: number) => void;
};

export default function SignalScreenerList({
  signals,
  expandedId,
  marketPrices,
  timeframeId,
  onToggle,
  onPriceTick,
}: SignalScreenerListProps) {
  if (signals.length === 0) {
    return (
      <div className={styles.screenerContent}>
        <p className={styles.emptyList}>No signals match your filters.</p>
      </div>
    );
  }

  return (
    <div className={styles.screenerTable}>
      {signals.map((signal) => {
        const expanded = expandedId === signal.id;
        const marketPrice = marketPrices[signal.symbol];
        const sideClass =
          signal.side === "buy" ? styles.signalSideBuy : styles.signalSideSell;

        return (
          <article
            key={signal.id}
            className={[
              styles.screenerRowItem,
              expanded ? styles.screenerRowItemActive : undefined,
              expanded ? styles.screenerRowExpanded : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <button
              type="button"
              className={styles.screenerRow}
              onClick={() => onToggle(signal.id)}
              aria-expanded={expanded}
            >
              <div className={styles.screenerRowInner}>
                <div className={styles.screenerRowBody}>
                <div className={styles.cellSignalInfo}>
                  <div className={styles.signalPrimaryRow}>
                    <h3 className={styles.signalPair}>{signal.pair}</h3>
                    <span className={[styles.signalSide, sideClass].join(" ")}>
                      {signal.side === "buy" ? "Buy" : "Sell"}
                    </span>
                    <div className={styles.signalLiveBlock}>
                      <span className={styles.signalLiveLabel}>Live</span>
                      <MarketPriceTicker price={marketPrice ?? 0} />
                    </div>
                  </div>

                  <div className={styles.signalSecondaryRow}>
                    <div className={styles.signalContext}>
                      <span className={styles.cellSource}>{signal.sourceLabel}</span>
                      <p className={styles.cellDesc}>{signal.description}</p>
                    </div>
                    <div className={styles.signalAtBlock}>
                      <span className={styles.signalAtLabel}>Signal</span>
                      <strong className={styles.signalAtPrice}>
                        ${formatPrice(signal.signalPrice)}
                      </strong>
                      <time className={styles.signalAtDate} dateTime={String(signal.timestamp)}>
                        {formatSignalDate(signal.timestamp)}
                      </time>
                    </div>
                  </div>
                </div>

                <span
                  className={styles.cellChart}
                  onClick={(event) => event.stopPropagation()}
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                >
                  <SignalMiniChart
                    key={signal.symbol}
                    signal={signal}
                    marketPrice={marketPrice ?? 0}
                  />
                </span>
                </div>
              </div>
            </button>

            {expanded ? (
              <SignalDetailExpand
                signal={signal}
                marketPrice={marketPrice ?? 0}
                timeframeId={timeframeId}
                onPriceTick={(price, ts) => onPriceTick(signal.symbol, price, ts)}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
