import * as React from "react";
import { useEffect, useState } from "react";
import type { Interval } from "@dexer-io/chart";
import { SelectButton, TextButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";

interface IntervalSwitchProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
  onIntervalChange?: (symbol: string) => void;
}

export const IntervalSwitch = (props: IntervalSwitchProps) => {
  const instrument = props?.chart?.getInstrument();
  const interval = props?.chart?.getInterval();
  const [intervalSymbol, setIntervalSymbol] = useState(interval?.symbol);

  const getAvailableIntervalsSymbols = () => {
    if (!instrument) return null;

    const availableIntervals = instrument.availableIntervals || [];
    if (!availableIntervals.length) return null;

    return availableIntervals.reduce<Record<string, { text: JSX.Element; id: string }>>(
      (previous, current: Interval) => {
        if (!current.symbol) {
          return previous;
        }

        const context = intervalSymbol === current.symbol ? "toolbar" : "subMenu";
        previous[current.symbol] = {
          text: <TextButton themeContext={context}>{current.symbol}</TextButton>,
          id: current.symbol,
        };
        return previous;
      },
      {}
    );
  };

  useEffect(() => {
    const subscription = props?.chart?.subscribe("INTERVAL_CHANGE", (data) => {
      setTimeout(() => {
        setIntervalSymbol(data.symbol);
      }, 0);
    });

    return () => {
      subscription?.unsubscribe();
    };
  });

  const render = () => {
    const availableIntervalsSymbols = getAvailableIntervalsSymbols();

    if (availableIntervalsSymbols) {
      return (
        <SelectButton
          // @ts-ignore
          style={{ ...props.style, minWidth: 34 }}
          options={availableIntervalsSymbols}
          onSelect={(option) => {
            if (props.onIntervalChange && option != undefined) props.onIntervalChange(option);
          }}
          selectedOption={intervalSymbol || "1h"}
        />
      );
    } else {
      return <></>;
    }
  };

  return render();
};
