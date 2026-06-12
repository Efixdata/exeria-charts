import type { OpenPosition } from "./mockMarketData";
import { computeUnrealizedPnl } from "./positionPnl";
import { formatPrice, formatSize } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type OpenPositionsPanelProps = {
  positions: OpenPosition[];
  markPrices: Record<string, number>;
  onClosePosition: (positionId: string) => void;
};

export default function OpenPositionsPanel({
  positions,
  markPrices,
  onClosePosition,
}: OpenPositionsPanelProps) {
  if (positions.length === 0) {
    return (
      <p className={styles.emptyState}>
        No open positions. When a limit order fills, the position appears here and on the chart.
        Close from the chart line (×) or below — drag the SL/TP handle on the position line to add
        protective orders.
      </p>
    );
  }

  return (
    <ul className={styles.positionsList}>
      {positions.map((position) => {
        const mark = markPrices[position.symbol];
        const pnl = mark !== undefined ? computeUnrealizedPnl(position, mark) : null;
        const pnlClass =
          pnl === null
            ? undefined
            : pnl.usd >= 0
              ? styles.pnlPositive
              : styles.pnlNegative;

        return (
          <li key={position.id} className={styles.positionCard}>
            <div className={styles.positionCardHeader}>
              <div className={styles.positionIdentity}>
                <strong>{position.symbol.replace("USDT", "/USDT")}</strong>
                <span
                  className={
                    position.side === "buy" ? styles.positionSideBuy : styles.positionSideSell
                  }
                >
                  {position.side.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                className={styles.positionCancel}
                aria-label={`Close ${position.side} position`}
                onClick={() => onClosePosition(position.id)}
              >
                ×
              </button>
            </div>
            <div className={styles.positionMeta}>
              <span>Entry ${formatPrice(position.entryPrice)}</span>
              <span>{formatSize(position.size)}</span>
              {pnl ? (
                <span className={pnlClass}>
                  {pnl.usd >= 0 ? "+" : ""}
                  {pnl.usd.toFixed(2)} ({pnl.percent >= 0 ? "+" : ""}
                  {pnl.percent.toFixed(2)}%)
                </span>
              ) : (
                <span>{new Date(position.openedAt).toLocaleTimeString()}</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
