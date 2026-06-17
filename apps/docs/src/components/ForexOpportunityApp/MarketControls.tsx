import { FOREX_PAIRS, FOREX_TIMEFRAMES, type ForexTimeframeId } from "./forexInstruments";
import type { ForexDataMode } from "./ForexChartHost";
import MenuSelect from "./MenuSelect";
import styles from "./forexOpportunityApp.module.css";

type MarketControlsProps = {
  symbol: string;
  timeframeId: ForexTimeframeId;
  dataMode: ForexDataMode;
  onSymbolChange: (symbol: string) => void;
  onTimeframeChange: (timeframeId: ForexTimeframeId) => void;
};

export default function MarketControls({
  symbol,
  timeframeId,
  dataMode,
  onSymbolChange,
  onTimeframeChange,
}: MarketControlsProps) {
  return (
    <div className={styles.marketControls} data-tour="market-controls">
      <MenuSelect
        label="Pair"
        value={symbol}
        options={FOREX_PAIRS.map((pair) => ({
          value: pair.id,
          label: pair.buttonLabel,
        }))}
        onChange={onSymbolChange}
      />

      <MenuSelect
        label="TF"
        value={timeframeId}
        options={FOREX_TIMEFRAMES.map((tf) => ({
          value: tf.id,
          label: tf.label,
        }))}
        onChange={onTimeframeChange}
      />

      <span className={styles.dataModeBadge} data-mode={dataMode}>
        Static FX data
      </span>
    </div>
  );
}
