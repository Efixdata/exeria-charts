import { useId, useMemo } from "react";
import styles from "./signalTerminalApp.module.css";

type SignalSparklineProps = {
  points: number[];
  signalPrice: number;
  side: "buy" | "sell";
  /** When false, connect closes with straight segments (better for OHLC sparklines). */
  smooth?: boolean;
};

const W = 120;
const H = 36;

export default function SignalSparkline({
  points,
  signalPrice,
  side,
  smooth = true,
}: SignalSparklineProps) {
  const gradientId = useId();
  const tone = side === "buy" ? styles.sparkUp : styles.sparkDown;

  const { linePath, signalY, areaPath } = useMemo(() => {
    if (points.length < 2) {
      return { linePath: "", signalY: H / 2, areaPath: "" };
    }

    const min = Math.min(...points, signalPrice);
    const max = Math.max(...points, signalPrice);
    const range = max - min || 1;
    const pad = 4;

    const coords = points.map((point, index) => ({
      x: (index / (points.length - 1)) * W,
      y: pad + (H - pad * 2) * (1 - (point - min) / range),
    }));

    const sy = pad + (H - pad * 2) * (1 - (signalPrice - min) / range);

    let path = `M ${coords[0]?.x.toFixed(1)} ${coords[0]?.y.toFixed(1)}`;
    if (smooth) {
      for (let i = 1; i < coords.length; i += 1) {
        const prev = coords[i - 1];
        const cur = coords[i];
        if (!prev || !cur) continue;
        const midX = (prev.x + cur.x) / 2;
        path += ` C ${midX.toFixed(1)} ${prev.y.toFixed(1)}, ${midX.toFixed(1)} ${cur.y.toFixed(1)}, ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
      }
    } else {
      for (let i = 1; i < coords.length; i += 1) {
        const cur = coords[i];
        if (cur) {
          path += ` L ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
        }
      }
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const area = last && first ? `${path} L ${last.x.toFixed(1)} ${H} L ${first.x.toFixed(1)} ${H} Z` : "";

    return { linePath: path, signalY: sy, areaPath: area };
  }, [points, signalPrice, smooth]);

  if (!linePath) {
    return <div className={styles.sparkEmpty} aria-hidden />;
  }

  return (
    <svg className={[styles.spark, tone].join(" ")} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <line
        x1={0}
        y1={signalY}
        x2={W}
        y2={signalY}
        className={styles.sparkSignalLine}
        strokeDasharray="3 3"
      />
      <path d={linePath} fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}
