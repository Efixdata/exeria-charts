import * as React from "react";
import { ButtonSelect } from "ui";

interface TopMenuProps {
    chart: any;
}

export const TopMenu = (props: TopMenuProps) => {
    const instrument = props?.chart?.getInstrument();
    console.log(props.chart);
    const getAvailableIntervalsSymbols = () => {
        if (!instrument) return [];
        return instrument.availableIntervals.map((interval: any) => {
          return interval.symbol;
        });
      }
  return (
    <div>
      <ButtonSelect
        options={getAvailableIntervalsSymbols()}
        onSelect={(option) => {
          console.log(option);
        }}
        selectedOption={instrument?.interval?.symbol}
      />
    </div>
  );
};
