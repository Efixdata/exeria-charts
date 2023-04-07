import * as React from "react";
import { useEffect, useState } from "react";
import { SelectButton, TextButton } from "ui";

interface IntervalSwitchProps {
  chart: any;
  style?: React.CSSProperties;
  onIntervalChange?: (symbol: string) => void;
}

export const IntervalSwitch = (props: IntervalSwitchProps) => {
  const instrument = props?.chart?.getInstrument();
  const interval = props?.chart?.getInterval();
  const [intervalSymbol, setIntervalSymbol] = useState(interval);

  const getAvailableIntervalsSymbols = () => {
    if (!instrument) return null;

    return [{}, ...instrument.availableIntervals].reduce((previous, current) => {
      previous[current.symbol] = {
        text: <TextButton>{ current.symbol }</TextButton>,
        id: current.symbol
      }
      return previous;
    });
  };

  useEffect(() => {
    const subscription = props?.chart?.subscribe("INTERVAL_CHANGE", (data: any) => {
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
                style={{...props.style, minWidth: 34}}
                options={availableIntervalsSymbols}
                onSelect={(option) => { 
                  if (props.onIntervalChange && option != undefined) props.onIntervalChange(option);
                }}
                selectedOption={intervalSymbol}
            />
        )
    } else {
        return <></>
    }
  }
  
  return render();
};
