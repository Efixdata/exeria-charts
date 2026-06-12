import { WATCHLIST_SYMBOLS } from "../CryptoTerminalApp/constants";
import FilterSelect from "./FilterSelect";
import type { SignalFilters } from "./signalCatalog";
import styles from "./signalTerminalApp.module.css";

type SignalFiltersBarProps = {
  filters: SignalFilters;
  onChange: (patch: Partial<SignalFilters>) => void;
};

export default function SignalFiltersBar({ filters, onChange }: SignalFiltersBarProps) {
  return (
    <div className={styles.filtersBar}>
      <FilterSelect
        label="Instrument"
        value={filters.symbol}
        options={[
          { value: "all", label: "All" },
          ...WATCHLIST_SYMBOLS.map((item) => ({ value: item.id, label: item.pair })),
        ]}
        onChange={(symbol) => onChange({ symbol })}
      />

      <FilterSelect
        label="Time"
        value={String(filters.timeWindowHours)}
        options={[
          { value: "1", label: "Last 1h" },
          { value: "6", label: "Last 6h" },
          { value: "24", label: "Last 24h" },
          { value: "all", label: "All" },
        ]}
        onChange={(value) =>
          onChange({
            timeWindowHours: value === "all" ? "all" : Number.parseInt(value, 10),
          })
        }
      />

      <FilterSelect
        label="Side"
        value={filters.side}
        options={[
          { value: "all", label: "All" },
          { value: "buy", label: "Buy" },
          { value: "sell", label: "Sell" },
        ]}
        onChange={(side) => onChange({ side })}
      />

      <FilterSelect
        label="Source"
        value={filters.source}
        options={[
          { value: "all", label: "All" },
          { value: "strategy", label: "Strategy" },
          { value: "api", label: "External API" },
          { value: "publisher", label: "Publisher" },
          { value: "custom", label: "My rules" },
        ]}
        onChange={(source) => onChange({ source })}
      />

      <FilterSelect
        label="Type"
        value={filters.signalType}
        options={[
          { value: "all", label: "All" },
          { value: "momentum", label: "Momentum" },
          { value: "breakout", label: "Breakout" },
          { value: "custom", label: "Custom" },
        ]}
        onChange={(signalType) => onChange({ signalType })}
      />
    </div>
  );
}
