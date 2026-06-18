import type { ChartInstance } from "@efixdata/exeria-chart";
import type { TimeframeId } from "./constants";
import CryptoTerminalChartHost from "./CryptoTerminalChartHost";
import styles from "./cryptoTerminalApp.module.css";

type MultiChartGridProps = {
  primarySymbol: string;
  primaryLabel: string;
  compareSymbol: string;
  compareLabel: string;
  timeframeId: TimeframeId;
  onPrimaryPriceTick: (price: number, timestamp: number) => void;
  onCandleCount: (count: number) => void;
  onLoadingChange: (loading: boolean) => void;
  onChartReady?: ((chart: ChartInstance | null) => void) | undefined;
  onChartClickPrice?: ((price: number) => void) | undefined;
  showClickHint: boolean;
};

export default function MultiChartGrid({
  primarySymbol,
  primaryLabel,
  compareSymbol,
  compareLabel,
  timeframeId,
  onPrimaryPriceTick,
  onCandleCount,
  onLoadingChange,
  onChartReady,
  onChartClickPrice,
  showClickHint,
}: MultiChartGridProps) {
  return (
    <div className={styles.multiChartGrid}>
      <div className={styles.chartPane}>
        <div className={styles.chartPaneLabel}>{primaryLabel}</div>
        <CryptoTerminalChartHost
          selectedSymbol={primarySymbol}
          symbolLabel={primaryLabel}
          timeframeId={timeframeId}
          onPriceTick={onPrimaryPriceTick}
          onCandleCount={onCandleCount}
          onLoadingChange={onLoadingChange}
          onChartReady={onChartReady}
          onChartClickPrice={onChartClickPrice}
        />
      </div>
      <div className={styles.chartPane}>
        <div className={styles.chartPaneLabel}>{compareLabel}</div>
        <CryptoTerminalChartHost
          selectedSymbol={compareSymbol}
          symbolLabel={compareLabel}
          timeframeId={timeframeId}
          onPriceTick={() => undefined}
          onCandleCount={() => undefined}
          onLoadingChange={() => undefined}
          onChartReady={() => undefined}
        />
      </div>
    </div>
  );
}
