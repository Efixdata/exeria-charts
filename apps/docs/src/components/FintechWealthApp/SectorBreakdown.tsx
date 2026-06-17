import type { CSSProperties } from "react";
import { formatSharePercent } from "./formatters";
import type { SectorWeight } from "./wealthAnalytics";
import styles from "./fintechWealthApp.module.css";

type SectorBreakdownProps = {
  sectors: SectorWeight[];
};

export default function SectorBreakdown({ sectors }: SectorBreakdownProps) {
  if (sectors.length === 0) {
    return null;
  }

  return (
    <div className={styles.sectorBreakdown} aria-label="Sector breakdown">
      <div className={styles.sectorStack} aria-hidden>
        {sectors.map((sector) => (
          <span
            key={sector.sector}
            className={styles.sectorStackSegment}
            style={
              {
                "--sector-color": sector.color,
                flexGrow: sector.weight,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <ul className={styles.sectorList}>
        {sectors.map((sector) => (
          <li key={sector.sector}>
            <span className={styles.sectorSwatch} style={{ background: sector.color }} />
            <span className={styles.sectorName}>{sector.sector}</span>
            <strong>{formatSharePercent(sector.weight * 100)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
