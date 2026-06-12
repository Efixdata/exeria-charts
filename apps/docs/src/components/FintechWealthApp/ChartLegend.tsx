import type { CSSProperties } from "react";
import type { AssetPerformance } from "./fintechCompareChartSetup";
import styles from "./fintechWealthApp.module.css";

type ChartLegendProps = {
  rows: AssetPerformance[];
  focusedAssetId: string | null;
  onSelect: (assetId: string | null) => void;
};

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function ChartLegend({ rows, focusedAssetId, onSelect }: ChartLegendProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className={styles.chartLegend} role="list" aria-label="Chart series">
      {rows.map((row) => {
        const isFocused = focusedAssetId === row.asset.id;
        const isDimmed = focusedAssetId != null && !isFocused;

        return (
          <button
            key={row.asset.id}
            type="button"
            role="listitem"
            className={styles.chartLegendChip}
            data-variant="asset"
            data-focused={isFocused ? "true" : "false"}
            data-dimmed={isDimmed ? "true" : "false"}
            style={
              {
                "--series-color": row.asset.color,
              } as CSSProperties
            }
            onClick={() => onSelect(isFocused ? null : row.asset.id)}
          >
            <span className={styles.chartLegendDot} />
            <span className={styles.chartLegendLabel}>{row.asset.label}</span>
            <span className={styles.chartLegendValue}>{formatPercent(row.changePercent)}</span>
          </button>
        );
      })}
    </div>
  );
}
