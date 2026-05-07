// @ts-nocheck
import React, { useState, useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
// @ts-ignore
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { ShareChartButton } from "./ShareChartButton";
import { IndicatorsButton } from "./Indicators/IndicatorsButton";
import type { NullableChartInstance } from "../../chartTypes";

interface TopMenuProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
  mainContainer: React.RefObject<unknown>;
  onIntervalChange?: (symbol: string) => void;
  className?: string;
}

const RightSection = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: auto;
  gap: 16px;
  align-items: center;
  @media (max-width: 600px) {
    gap: 4px;
    margin-left: auto !important;
  }
`

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  background: ${props => props.theme.toolbar.background};

  border-bottom: ${props => props.theme.border.inner || "none"};
  border-left: ${props => props.theme.border.outter || "none"};
  border-right: ${props => props.theme.border.outter || "none"};
  border-top: ${props => props.theme.border.outter || "none"};
  border-radius: ${props => props.theme.border.radius + 'px' || 0};

  &.right {
    @media (min-width: 600px) {
      width: fit-content;
      margin-left: auto;
    }
  }
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
  const tc = useContext(ThemeContext);

  const getAvailableIntervalsSymbols = () => {
    if (!instrument) return [];
    return (instrument.availableIntervals || []).map((interval) => {
      return interval.symbol;
    });
  };
  
  const renderShareChartButton = () => {
    if (tc?.toolbar?.showShareChartButton)
      return <ShareChartButton chart={props.chart} />
  }

  const renderChartScaleSwitch = () => {
    if (tc?.toolbar?.showChartScaleSwitch === false) return;
    return <ChartScaleSwitch chart={props.chart} />
  }

  const renderShowCurrency = () => {
    if (tc?.toolbar?.showCurrency === false) return;
    return <CurrencySwitch chart={props.chart} />
  }

  return (
    <Container style={props.style} className={props.className}>
      <LeftSection
        style={{
          paddingRight: tc?.toolbar?.showCurrency === false ? '8px' : '0'
        }}
      >
        <MainChartTypeSelect chart={props.chart} />
        <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange}/>
        <IndicatorsButton chart={props.chart} />
        
        <RightSection
          style={{
            marginLeft: tc?.toolbar?.topMenuPosition === 'right' ? '8px' : '0'
          }}
        >
          <AutoScaleSwitch chart={props.chart} />
          {renderChartScaleSwitch()}
          <Icons>
            <FullScreenButton chart={props.chart} mainContainer={props.mainContainer}/>
            {renderShareChartButton()}
          </Icons>
        </RightSection>
      </LeftSection>
      {renderShowCurrency()}
    </Container>
  );
};

