    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
import { TRUST_PILLS } from "./constants";
import styles from "./signalTerminalApp.module.css";

export default function TrustStrip() {
  return (
    <div className={styles.featureStrip} aria-label="Platform capabilities">
      {TRUST_PILLS.map((pill) => (
        <div key={pill.label} className={styles.featurePill} title={pill.detail}>
          <span className={styles.featurePillDot} aria-hidden />
          <span className={styles.featurePillLabel}>{pill.label}</span>
        </div>
      ))}
    </div>
  );
}
