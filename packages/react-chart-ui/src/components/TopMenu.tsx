import * as React from "react";
import styled from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
// @ts-ignore
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { SaveChartImageButton } from "./SaveChartImageButton";
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
    // @ts-ignore
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
            <SaveChartImageButton chart={props.chart} />
            <ShareChartButton chart={props.chart} />
          </Icons>
        </RightSection>
      </LeftSection>
      <CurrencySwitch chart={props.chart} />
    </Container>
  );
};
