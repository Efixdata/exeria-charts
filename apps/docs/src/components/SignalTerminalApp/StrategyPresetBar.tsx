import type { StrategyPresetId } from "./constants";
import { STRATEGY_PRESETS } from "./constants";
import styles from "./signalTerminalApp.module.css";

type StrategyPresetBarProps = {
  activePreset: StrategyPresetId;
  activeHint: string;
  onSelect: (presetId: StrategyPresetId) => void;
};

export default function StrategyPresetBar({
  activePreset,
  activeHint,
  onSelect,
}: StrategyPresetBarProps) {
  return (
    <div className={styles.presetBar}>
      <span className={styles.presetLabel}>Signal lens</span>
      <div className={styles.chipRow} role="group" aria-label="Signal lens">
        {STRATEGY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={[
              styles.chip,
              activePreset === preset.id ? styles.chipActive : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => onSelect(preset.id)}
            title={preset.hint}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <p className={styles.presetHint}>{activeHint}</p>
    </div>
  );
}
