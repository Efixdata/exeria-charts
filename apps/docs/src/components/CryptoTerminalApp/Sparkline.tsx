import { useId, useMemo } from "react";
import styles from "./cryptoTerminalApp.module.css";

type SparklineProps = {
  points: number[];
  positive: boolean;
};

const VIEW_WIDTH = 120;
const VIEW_HEIGHT = 28;

function buildCoords(points: number[], width: number, height: number) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 3;

  return points.map((point, index) => ({
    x: (index / (points.length - 1)) * width,
    y: paddingY + (height - paddingY * 2) * (1 - (point - min) / range),
  }));
}

function buildSmoothLinePath(coords: Array<{ x: number; y: number }>) {
  if (coords.length < 2) {
    return "";
  }

  let path = `M ${coords[0]!.x.toFixed(2)} ${coords[0]!.y.toFixed(2)}`;

  for (let index = 1; index < coords.length; index += 1) {
    const previous = coords[index - 1]!;
    const current = coords[index]!;
    const midX = (previous.x + current.x) / 2;
    path += ` C ${midX.toFixed(2)} ${previous.y.toFixed(2)}, ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
  }

  return path;
}

function buildAreaPath(linePath: string, coords: Array<{ x: number; y: number }>, height: number) {
  if (!linePath || coords.length < 2) {
    return "";
  }

  const last = coords[coords.length - 1]!;
  const first = coords[0]!;
  return `${linePath} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

export default function Sparkline({ points, positive }: SparklineProps) {
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) {
      return { linePath: "", areaPath: "" };
    }

    const coords = buildCoords(points, VIEW_WIDTH, VIEW_HEIGHT);
    const line = buildSmoothLinePath(coords);
    return {
      linePath: line,
      areaPath: buildAreaPath(line, coords, VIEW_HEIGHT),
    };
  }, [points]);

  if (!linePath) {
    return null;
  }

  const toneClass = positive ? styles.sparklineUp : styles.sparklineDown;

  return (
    <svg
      className={[styles.sparkline, toneClass].join(" ")}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={styles.sparklineArea} d={areaPath} fill={`url(#${gradientId})`} />
      <path
        className={styles.sparklineLine}
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
