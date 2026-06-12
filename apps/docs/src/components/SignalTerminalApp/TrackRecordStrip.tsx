import { TRACK_RECORD_DEMO } from "./marketContext";
import styles from "./signalTerminalApp.module.css";

export default function TrackRecordStrip() {
  const record = TRACK_RECORD_DEMO;

  return (
    <div className={styles.trackRecord} aria-label="Signal track record">
      <span className={styles.trackLabel}>{record.windowLabel}</span>
      <div className={styles.trackStats}>
        <span>
          <strong>{record.winRate}%</strong> hit rate
        </span>
        <span>
          <strong>{record.signalCount}</strong> signals
        </span>
        <span>
          <strong>+{record.avgReturnPct}%</strong> avg move
        </span>
      </div>
      <span className={styles.trackDisclaimer}>{record.disclaimer}</span>
    </div>
  );
}
