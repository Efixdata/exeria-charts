import * as React from "react";
import { ButtonSelect } from "ui";
import styled from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";

interface TopMenuProps {
  chart: any;
  style?: React.CSSProperties;
}

const RightSection = styled.div`
display: flex;
flex-direction: row;
margin-left: auto;
gap: 16px;
`

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
        <RightSection>
          <AutoScaleSwitch chart={props.chart} />
          <ChartScaleSwitch chart={props.chart} />
        </RightSection>
      </LeftSection>
      <div style={{ width: valueAxisWidth, borderLeft: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", alignItems: "center"}}>
        <div style={{ color: "#7f9dcc", marginLeft: "auto", marginRight: "8px" }}>{props?.chart?.getCurrency()}</div>
      </div>
    </Container>
  );
};
