import { useEffect, useState } from "react";
import styles from "./signalTerminalApp.module.css";

type SettingsTab = "alerts" | "automation" | "rules";

type SettingsDrawerProps = {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
};

export default function SettingsDrawer({
  open,
  initialTab = "alerts",
  onClose,
}: SettingsDrawerProps) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);
  const [telegram, setTelegram] = useState(true);
  const [sms, setSms] = useState(false);
  const [email, setEmail] = useState(true);
  const [autoTrade, setAutoTrade] = useState(false);

  if (!open) {
    return null;
  }

  return (
    <>
      <button type="button" className={styles.drawerBackdrop} aria-label="Close" onClick={onClose} />
      <section className={styles.drawer} aria-label="Settings">
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>Configure</h2>
          <button type="button" className={styles.ghostButton} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.tabRow}>
          {(
            [
              ["alerts", "Alerts"],
              ["automation", "Automation"],
              ["rules", "My signals"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={[styles.tab, tab === id ? styles.tabActive : undefined]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "alerts" ? (
          <div className={styles.settingsSection}>
            <p className={styles.settingsLead}>Choose where new screener signals are delivered.</p>
            <label className={styles.settingsCheck}>
              <input type="checkbox" checked={telegram} onChange={(e) => setTelegram(e.target.checked)} />
              Telegram bot
            </label>
            <label className={styles.settingsCheck}>
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />
              SMS
            </label>
            <label className={styles.settingsCheck}>
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} />
              Email
            </label>
            <label className={styles.settingsCheck}>
              <input type="checkbox" defaultChecked />
              In-app feed only
            </label>
          </div>
        ) : null}

        {tab === "automation" ? (
          <div className={styles.settingsSection}>
            <p className={styles.settingsLead}>
              Route selected signals to your broker API. Demo UI — wire real keys in your backend.
            </p>
            <label className={styles.settingsCheck}>
              <input type="checkbox" checked={autoTrade} onChange={(e) => setAutoTrade(e.target.checked)} />
              Enable auto-execution
            </label>
            <label className={styles.tradeField}>
              <span>Broker webhook URL</span>
              <input placeholder="https://api.your-broker.com/orders" />
            </label>
            <label className={styles.tradeField}>
              <span>Default size</span>
              <input defaultValue="0.01" inputMode="decimal" />
            </label>
            <label className={styles.tradeField}>
              <span>Markets</span>
              <select defaultValue="crypto">
                <option value="crypto">Crypto USDT</option>
                <option value="spot">Spot EUR</option>
              </select>
            </label>
            <label className={styles.tradeField}>
              <span>Auto sources</span>
              <select defaultValue="strategy">
                <option value="strategy">Strategy only</option>
                <option value="all">All sources</option>
                <option value="publisher">Publisher only</option>
              </select>
            </label>
          </div>
        ) : null}

        {tab === "rules" ? (
          <div className={styles.settingsSection}>
            <p className={styles.settingsLead}>
              Publish custom signals from Exeria strategies or your own scoring pipeline.
            </p>
            <ul className={styles.rulesList}>
              <li>
                <strong>RSI &lt; 30 dip buy</strong>
                <span>Custom · BTC, ETH</span>
              </li>
              <li>
                <strong>CROSS on 1H</strong>
                <span>Strategy · watchlist</span>
              </li>
              <li>
                <strong>EXCEED + volume spike</strong>
                <span>Strategy · all USDT pairs</span>
              </li>
            </ul>
            <button type="button" className={styles.ghostButton}>
              + Add rule from strategy
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
