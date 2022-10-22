import * as React from "react";
import { SelectButton, TextButton } from "ui";

interface IntervalSwitchProps {
  chart: any;
  style?: React.CSSProperties;
}

export const IntervalSwitch = (props: IntervalSwitchProps) => {
  const instrument = props?.chart?.getInstrument();

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

  const render = () => {
    const availableIntervalsSymbols = getAvailableIntervalsSymbols();

    if (availableIntervalsSymbols) {
        return (
            <SelectButton
                style={{...props.style, minWidth: 34}}
                options={availableIntervalsSymbols}
                onSelect={(option) => { console.log(option); }}
                selectedOption={instrument?.interval?.symbol}
            />
        )
    } else {
        return <></>
    }
  }
  
  return render();
};
