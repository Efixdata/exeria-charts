import type { StreamLatency } from "./useBinanceMarketStreams";
import styles from "./cryptoTerminalApp.module.css";

type LatencyPanelProps = {
  depthFreshnessMs: number | null;
  tapeMs: number | null;
  tickerMs: number | null;
  streamsConnected: boolean;
};

function formatLatency(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return `${Math.round(value)}ms`;
}

function latencyClass(value: number | null): string | undefined {
  if (value === null) {
    return undefined;
  }
  if (value <= 120) {
    return styles.latencyGood;
  }
  if (value <= 350) {
    return styles.latencyMid;
  }
  return styles.latencySlow;
}

export default function LatencyPanel({
  depthFreshnessMs,
  tapeMs,
  tickerMs,
  streamsConnected,
}: LatencyPanelProps) {
  return (
    <div className={styles.latencyPanel} aria-label="Feed latency">
      <span className={styles.latencyLabel}>Latency</span>
      <span
        className={[styles.latencyItem, latencyClass(depthFreshnessMs)]
          .filter(Boolean)
          .join(" ")}
        title="Time since last depth snapshot (100ms stream)"
      >
        Depth {formatLatency(depthFreshnessMs)}
      </span>
      <span className={[styles.latencyItem, latencyClass(tapeMs)].filter(Boolean).join(" ")}>
        Tape {formatLatency(tapeMs)}
      </span>
      <span className={[styles.latencyItem, latencyClass(tickerMs)].filter(Boolean).join(" ")}>
        Ticker {formatLatency(tickerMs)}
      </span>
      <span className={streamsConnected ? styles.latencyConnected : styles.latencyDisconnected}>
        {streamsConnected ? "WS connected" : "WS connecting…"}
      </span>
    </div>
  );
}
