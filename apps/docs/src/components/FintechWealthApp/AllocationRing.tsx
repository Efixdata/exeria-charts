import { useMemo } from "react";
import { formatSharePercent } from "./formatters";
import type { HoldingRow } from "./portfolioModel";
import styles from "./fintechWealthApp.module.css";

type AllocationRingProps = {
  holdings: HoldingRow[];
};

const SIZE = 112;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AllocationRing({ holdings }: AllocationRingProps) {
  const segments = useMemo(() => {
    const total = holdings.reduce((sum, row) => sum + row.holdingValueEur, 0) || 1;
    let offset = 0;

    return holdings.map((row) => {
      const fraction = row.holdingValueEur / total;
      const length = fraction * CIRCUMFERENCE;
      const segment = {
        id: row.asset.id,
        color: row.asset.color,
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        offset: -offset,
        label: row.asset.label,
        percent: fraction * 100,
      };
      offset += length;
      return segment;
    });
  }, [holdings]);

  if (holdings.length === 0) {
    return <div className={styles.allocationRingEmpty} aria-hidden />;
  }

  return (
    <div className={styles.allocationRing}>
      <div className={styles.allocationChart}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.allocationSvg} aria-hidden>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#151821"
            strokeWidth={STROKE}
          />
          {segments.map((segment) => (
            <circle
              key={segment.id}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={segment.color}
              strokeWidth={STROKE}
              strokeDasharray={segment.dasharray}
              strokeDashoffset={segment.offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              style={{ filter: `drop-shadow(0 0 6px ${segment.color}88)` }}
            />
          ))}
        </svg>
        <div className={styles.allocationCenter}>
          <span className={styles.allocationCenterLabel}>Live</span>
          <strong>{holdings.length}</strong>
          <span className={styles.allocationCenterSub}>holdings</span>
        </div>
      </div>
      <ul className={styles.allocationLegend}>
        {segments.map((segment) => (
          <li key={segment.id}>
            <span className={styles.allocationSwatch} style={{ background: segment.color }} />
            <span>{segment.label}</span>
            <strong>{formatSharePercent(segment.percent)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
