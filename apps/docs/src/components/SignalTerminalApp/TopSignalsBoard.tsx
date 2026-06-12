import { formatPrice } from "../CryptoTerminalApp/terminalFormat";
import { formatConfluence, getBearishSignals, getBullishSignals, type SignalEvent } from "./mockSignals";
import styles from "./signalTerminalApp.module.css";

type TopSignalsBoardProps = {
  selectedSymbol: string;
  onSelect: (symbolId: string) => void;
};

function SignalColumn({
  title,
  tone,
  events,
  selectedSymbol,
  onSelect,
}: {
  title: string;
  tone: "bull" | "bear";
  events: SignalEvent[];
  selectedSymbol: string;
  onSelect: (symbolId: string) => void;
}) {
  return (
    <div className={styles.topSignalsColumn}>
      <h3 className={[styles.topSignalsHeading, tone === "bull" ? styles.changeUp : styles.changeDown].join(" ")}>
        {title}
      </h3>
      <ul className={styles.topSignalsList}>
        {events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              className={[
                styles.topSignalItem,
                selectedSymbol === event.symbol ? styles.topSignalItemActive : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelect(event.symbol)}
            >
              <div className={styles.topSignalRow}>
                <strong>{event.symbol.replace("USDT", "")}</strong>
                <span className={tone === "bull" ? styles.changeUp : styles.changeDown}>
                  {formatConfluence(event.confluence)}
                </span>
              </div>
              <span className={styles.topSignalMeta}>
                {event.strategy} · ${formatPrice(event.price)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TopSignalsBoard({ selectedSymbol, onSelect }: TopSignalsBoardProps) {
  const bullish = getBullishSignals(3);
  const bearish = getBearishSignals(3);

  return (
    <section className={styles.topSignalsBoard} aria-label="Top signals right now">
      <div className={styles.panelHeaderRow}>
        <span className={styles.panelHeader}>Top signals now</span>
        <span className={styles.panelMeta}>by confluence</span>
      </div>
      <div className={styles.topSignalsGrid}>
        <SignalColumn
          title="Bullish"
          tone="bull"
          events={bullish}
          selectedSymbol={selectedSymbol}
          onSelect={onSelect}
        />
        <SignalColumn
          title="Bearish"
          tone="bear"
          events={bearish}
          selectedSymbol={selectedSymbol}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}
