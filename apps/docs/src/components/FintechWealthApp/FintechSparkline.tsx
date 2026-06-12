import { useId, useMemo } from "react";
import styles from "./fintechWealthApp.module.css";

type FintechSparklineProps = {
  points: number[];
  color: string;
  positive?: boolean;
  width?: number;
  height?: number;
};

function buildCoords(points: number[], width: number, height: number) {
  const valid = points.filter((point) => Number.isFinite(point));
  if (valid.length < 2) {
    return [];
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const paddingY = 2;

  return valid.map((point, index) => ({
    x: (index / (valid.length - 1)) * width,
    y: paddingY + (height - paddingY * 2) * (1 - (point - min) / range),
  }));
}

function buildSmoothLinePath(coords: Array<{ x: number; y: number }>) {
  if (coords.length < 2) {
    return "";
  }

  let path = `M ${coords[0].x.toFixed(2)} ${coords[0].y.toFixed(2)}`;

  for (let index = 1; index < coords.length; index += 1) {
    const previous = coords[index - 1];
    const current = coords[index];
    const midX = (previous.x + current.x) / 2;
    path += ` C ${midX.toFixed(2)} ${previous.y.toFixed(2)}, ${midX.toFixed(2)} ${current.y.toFixed(2)}, ${current.x.toFixed(2)} ${current.y.toFixed(2)}`;
  }

  return path;
}

function buildAreaPath(linePath: string, coords: Array<{ x: number; y: number }>, height: number) {
  if (!linePath || coords.length < 2) {
    return "";
  }

  const last = coords[coords.length - 1];
  const first = coords[0];
  return `${linePath} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;
}

export default function FintechSparkline({
  points,
  color,
  positive = true,
  width = 88,
  height = 32,
}: FintechSparklineProps) {
  const gradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    const finitePoints = points.filter((point) => Number.isFinite(point));
    if (finitePoints.length < 2) {
      return { linePath: "", areaPath: "" };
    }

    const coords = buildCoords(finitePoints, width, height);
    if (coords.length < 2) {
      return { linePath: "", areaPath: "" };
    }
    const line = buildSmoothLinePath(coords);
    return {
      linePath: line,
      areaPath: buildAreaPath(line, coords, height),
    };
  }, [height, points, width]);

  if (!linePath) {
    return <span className={styles.sparklinePlaceholder} aria-hidden />;
  }

  return (
    <svg
      className={styles.sparkline}
      data-tone={positive ? "up" : "down"}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden
      style={{ color }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={styles.sparklineArea} d={areaPath} fill={`url(#${gradientId})`} />
      <path
        className={styles.sparklineLine}
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
