import * as React from "react";
import { ButtonSelect } from "ui";
import styled from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";

interface TopMenuProps {
  chart: any;
  style?: React.CSSProperties;
}

const Container = styled.div`
  background-color: #100c22;
  display: flex;
  flex-direction: row;
`
const LeftSection = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  padding: 0 16px;
`

export const TopMenu = (props: TopMenuProps) => {
  const instrument = props?.chart?.getInstrument();

  const getAvailableIntervalsSymbols = () => {
    if (!instrument) return [];
    return instrument.availableIntervals.map((interval: any) => {
      return interval.symbol;
    });
  };

  let valueAxisWidth = props.chart ? props.chart.getValueAxisWidth() : 10;
  console.log(props.chart?.getCurrency())
  
  return (
    <Container style={props.style}>
      <LeftSection>
        <ButtonSelect
          options={getAvailableIntervalsSymbols()}
          onSelect={(option) => {
            console.log(option);
          }}
          selectedOption={instrument?.interval?.symbol}
        />
        <ChartScaleSwitch chart={props.chart} style={{ marginLeft: "auto" }}/>
      </LeftSection>
      <div style={{ width: valueAxisWidth, borderLeft: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center"}}>
        <div style={{ color: "#7f9dcc", marginLeft: "auto", marginRight: "8px" }}>{props?.chart?.getCurrency()}</div>
      </div>
    </Container>
  );
};
