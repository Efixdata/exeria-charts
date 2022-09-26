import * as React from "react";
import { ButtonSelect } from "ui";
import styled from "styled-components";

interface TopMenuProps {
  chart: any;
  style?: React.CSSProperties;
}

const Container = styled.div`
  background-color: #100c22;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`

export const TopMenu = (props: TopMenuProps) => {
  const instrument = props?.chart?.getInstrument();

  const getAvailableIntervalsSymbols = () => {
    if (!instrument) return [];
    return instrument.availableIntervals.map((interval: any) => {
      return interval.symbol;
    });
  };
  
  return (
    <Container style={props.style}>
      <ButtonSelect
        options={getAvailableIntervalsSymbols()}
        onSelect={(option) => {
          console.log(option);
        }}
        selectedOption={instrument?.interval?.symbol}
      />
    </Container>
  );
};
