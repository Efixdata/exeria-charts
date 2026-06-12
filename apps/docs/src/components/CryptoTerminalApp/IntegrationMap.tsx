import { INTEGRATION_MAP_ITEMS, type IntegrationStatus } from "./integrationMapData";
import styles from "./cryptoTerminalApp.module.css";

type IntegrationMapProps = {
  onOpenSource?: () => void;
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  live: "Live",
  simulated: "Simulated",
  "your-api": "Your API",
};

export default function IntegrationMap({ onOpenSource }: IntegrationMapProps) {
  return (
    <section className={styles.integrationMap} aria-label="Integration map">
      <div className={styles.integrationMapHeader}>
        <strong>Integration map</strong>
        <span>What is live vs simulated vs yours to wire</span>
      </div>
      <ul className={styles.integrationList}>
        {INTEGRATION_MAP_ITEMS.map((item) => (
          <li key={item.id} className={styles.integrationItem}>
            <div className={styles.integrationTop}>
              <span className={styles.integrationLabel}>{item.label}</span>
              <span
                className={[
                  styles.integrationStatus,
                  item.status === "live"
                    ? styles.integrationLive
                    : item.status === "simulated"
                      ? styles.integrationSimulated
                      : styles.integrationYourApi,
                ].join(" ")}
              >
                {STATUS_LABEL[item.status]}
              </span>
            </div>
            <div className={styles.integrationMeta}>
              <code>{item.component}</code>
              <span>·</span>
              <span>{item.module}</span>
            </div>
            <a className={styles.integrationDocsLink} href={item.docsHref}>
              {item.docsLabel} →
            </a>
          </li>
        ))}
      </ul>
      {onOpenSource ? (
        <button type="button" className={styles.integrationSourceButton} onClick={onOpenSource}>
          Open starter source
        </button>
      ) : null}
    </section>
  );
}
