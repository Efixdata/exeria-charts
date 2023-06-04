import * as React from "react";
import styled from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
// @ts-ignore
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { ShareChartButton } from "./ShareChartButton";
import { IndicatorsButton } from "./IndicatorsButton";

interface TopMenuProps {
  chart: any;
  style?: React.CSSProperties;
  mainContainer: React.RefObject<unknown>;
  onIntervalChange?: (symbol: string) => void;
}

const RightSection = styled.div`
display: flex;
flex-direction: row;
margin-left: auto;
gap: 16px;
align-items: center;
@media (max-width: 600px) {
  gap: 4px;
}
`

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  background: ${props => props.theme.background || "#100c22"};
  border-bottom: ${props => props.theme.border || "1px solid rgba(255, 255, 255, 0.1)"};
`
const LeftSection = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  z-index: 2;
`

const Icons = styled.div`
  display: flex;
  gap: 2px;
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
      <LeftSection>
        <MainChartTypeSelect chart={props.chart} />
        <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange}/>
        <IndicatorsButton chart={props.chart} />
        
        <RightSection>
          <AutoScaleSwitch chart={props.chart} />
          <ChartScaleSwitch chart={props.chart} />
          <Icons>
            <FullScreenButton chart={props.chart} mainContainer={props.mainContainer}/>
            <ShareChartButton chart={props.chart} />
          </Icons>
        </RightSection>
      </LeftSection>
      <CurrencySwitch chart={props.chart} />
    </Container>
  );
};
