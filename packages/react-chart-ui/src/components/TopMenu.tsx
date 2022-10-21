import * as React from "react";
import { ButtonSelect } from "ui";
import styled from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
// @ts-ignore
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";

interface TopMenuProps {
  chart: any;
  style?: React.CSSProperties;
  mainContainer: React.RefObject<unknown>;
}

const RightSection = styled.div`
display: flex;
flex-direction: row;
margin-left: auto;
gap: 16px;
align-items: center;
`

const Container = styled.div`
  background-color: #100c22;
  display: flex;
  flex-direction: row;
  z-index: 2;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`
const LeftSection = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: row;
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
    // @ts-ignore
    <Container style={props.style}>
      <LeftSection>
        <MainChartTypeSelect chart={props.chart} />
        {/* <ButtonSelect
          options={getAvailableIntervalsSymbols()}
          onSelect={(option) => {
            console.log(option);
          }}
          selectedOption={instrument?.interval?.symbol}
        /> */}
        <RightSection>
          <AutoScaleSwitch chart={props.chart} />
          <ChartScaleSwitch chart={props.chart} />
          <FullScreenButton chart={props.chart} mainContainer={props.mainContainer}/>
        </RightSection>
      </LeftSection>
      <CurrencySwitch chart={props.chart} />
    </Container>
  );
};
