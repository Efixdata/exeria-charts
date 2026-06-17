import type { PriceAlert } from "./priceAlerts";
import { formatAlertDirection } from "./priceAlerts";
import { formatPrice } from "./terminalFormat";
import styles from "./cryptoTerminalApp.module.css";

type AlertsPanelProps = {
  alerts: PriceAlert[];
  alertPrice: string;
  livePrice?: number;
  selectedSymbol: string;
  onAlertPriceChange: (value: string) => void;
  onAddAlert: () => void;
  onRemoveAlert: (alertId: string) => void;
};

export default function AlertsPanel({
  alerts,
  alertPrice,
  livePrice,
  selectedSymbol,
  onAlertPriceChange,
  onAddAlert,
  onRemoveAlert,
}: AlertsPanelProps) {
  const activeAlerts = alerts.filter((alert) => alert.triggeredAt === undefined);
  const triggeredAlerts = alerts.filter((alert) => alert.triggeredAt !== undefined);

  return (
    <div className={styles.alertsPanel}>
      <div className={styles.alertForm}>
        <div className={styles.field}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="alert-price">Alert price</label>
            {livePrice !== undefined ? (
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => onAlertPriceChange(formatPrice(livePrice))}
              >
                Use live
              </button>
            ) : null}
          </div>
          <input
            id="alert-price"
            value={alertPrice}
            onChange={(event) => onAlertPriceChange(event.target.value)}
            inputMode="decimal"
          />
        </div>

        <button type="button" className={styles.primaryButton} onClick={onAddAlert}>
          Set alert on chart
        </button>
      </div>

      {activeAlerts.length === 0 ? (
        <p className={styles.emptyState}>
          No active alerts for {selectedSymbol.replace("USDT", "/USDT")}. Click the chart or use
          live price to set a level.
        </p>
      ) : (
        <ul className={styles.alertsList}>
          {activeAlerts.map((alert) => (
            <li key={alert.id} className={styles.alertCard}>
              <div className={styles.alertTop}>
                <strong>${formatPrice(alert.price)}</strong>
                <span className={styles.alertDirection}>{formatAlertDirection(alert.direction)}</span>
              </div>
              <div className={styles.alertMeta}>
                <span>{alert.symbol.replace("USDT", "/USDT")}</span>
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => onRemoveAlert(alert.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {triggeredAlerts.length > 0 ? (
        <>
          <p className={styles.alertsTriggeredHeading}>Triggered</p>
          <ul className={styles.alertsList}>
            {triggeredAlerts.slice(0, 6).map((alert) => (
              <li key={alert.id} className={[styles.alertCard, styles.alertCardTriggered].join(" ")}>
                <div className={styles.alertTop}>
                  <strong>${formatPrice(alert.price)}</strong>
                  <span>{formatAlertDirection(alert.direction)}</span>
                </div>
                <div className={styles.alertMeta}>
                  <span>
                    {alert.symbol.replace("USDT", "/USDT")} ·{" "}
                    {alert.triggeredAt
                      ? new Date(alert.triggeredAt).toLocaleTimeString()
                      : "—"}
                  </span>
                  <button
                    type="button"
                    className={styles.linkButton}
                    onClick={() => onRemoveAlert(alert.id)}
                  >
                    Dismiss
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
