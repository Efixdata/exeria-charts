import FintechSingleAssetChart from "./FintechSingleAssetChart";
import { formatAssetPrice, formatDisplaySymbol } from "./formatters";
import type { FintechPeriodId } from "./constants";
import type { FintechThemeVariant } from "./fintechCompareChartSetup";
import type { FintechMarketId } from "./marketPresets";
import { formatHoldingQuantity, type HoldingRow } from "./portfolioModel";
import styles from "./fintechWealthApp.module.css";

type AssetDetailSheetProps = {
  row: HoldingRow | null;
  marketId: FintechMarketId;
  periodId: FintechPeriodId;
  interval: string;
  limit: number;
  themeVariant: FintechThemeVariant;
  onClose: () => void;
};

function formatCurrency(value: number, fractionDigits = 2): string {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export default function AssetDetailSheet({
  row,
  marketId,
  periodId,
  interval,
  limit,
  themeVariant,
  onClose,
}: AssetDetailSheetProps) {
  if (!row) {
    return null;
  }

  return (
    <>
      <button type="button" className={styles.sheetBackdrop} aria-label="Close asset detail" onClick={onClose} />
      <section
        className={styles.assetSheet}
        data-theme={themeVariant}
        aria-label={`${row.asset.label} detail`}
      >
        <div className={styles.sheetHandle} aria-hidden />
        <div className={styles.sheetHeader}>
          <div>
            <p className={styles.sheetEyebrow}>{row.asset.sector}</p>
            <h2 className={styles.sheetTitle}>{row.asset.label}</h2>
            <p className={styles.sheetPrice}>{formatAssetPrice(row.lastClose, marketId)}</p>
            <p
              className={styles.sheetChange}
              data-tone={row.changePercent >= 0 ? "up" : "down"}
            >
              {formatPercent(row.changePercent)} · period ({formatCurrency(row.periodChangeEur)} )
            </p>
          </div>
          <button type="button" className={styles.sheetClose} onClick={onClose}>
            Close
          </button>
        </div>

        <div className={styles.sheetChart}>
          <FintechSingleAssetChart
            asset={row.asset}
            marketId={marketId}
            periodId={periodId}
            interval={interval}
            limit={limit}
            themeVariant={themeVariant}
          />
        </div>

        <div className={styles.sheetStats}>
          <div>
            <span>Position</span>
            <strong>{formatCurrency(row.holdingValueEur, 0)}</strong>
          </div>
          <div>
            <span>Quantity</span>
            <strong>{formatHoldingQuantity(row.quantity, marketId, row.asset.symbol)}</strong>
          </div>
          <div>
            <span>Ticker</span>
            <strong>{formatDisplaySymbol(row.asset, marketId)}</strong>
          </div>
        </div>
      </section>
    </>
  );
}
