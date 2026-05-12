import React, { useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { ShareChartButton } from "./ShareChartButton";
import { IndicatorsButton } from "./Indicators/IndicatorsButton";
import type { NullableChartInstance, ShareConfig } from "../../chartTypes";

interface TopMenuProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties | undefined;
  mainContainer: React.RefObject<HTMLElement>;
  onIntervalChange?: ((symbol: string) => void) | undefined;
  className?: string | undefined;
  shareConfig?: ShareConfig | undefined;
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
`;

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  background: ${(props) => props.theme.toolbar.background};

  border-bottom: ${(props) => props.theme.border.inner || "none"};
  border-left: ${(props) => props.theme.border.outter || "none"};
  border-right: ${(props) => props.theme.border.outter || "none"};
  border-top: ${(props) => props.theme.border.outter || "none"};
  border-radius: ${(props) => props.theme.border.radius + "px" || 0};

  &.right {
    @media (min-width: 600px) {
      width: fit-content;
      margin-left: auto;
    }
  }
`;
const LeftSection = styled.div`
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  z-index: 2;
`;

const Icons = styled.div`
  display: flex;
  gap: 2px;
`;

export const TopMenu = (props: TopMenuProps) => {
  // @ts-ignore - styled-components ThemeContext type mismatch with React.useContext
  const tc = useContext(ThemeContext);

  const renderShareChartButton = () => {
    if (tc?.toolbar?.showShareChartButton) {
      return <ShareChartButton chart={props.chart} shareConfig={props.shareConfig} />;
    }
  };

  const renderChartScaleSwitch = () => {
    if (tc?.toolbar?.showChartScaleSwitch === false) return;
    return <ChartScaleSwitch chart={props.chart} />;
  };

  const renderShowCurrency = () => {
    if (tc?.toolbar?.showCurrency === false) return;
    return <CurrencySwitch chart={props.chart} />;
  };

  return (
    <Container style={props.style} className={props.className}>
      <LeftSection
        style={{
          paddingRight: tc?.toolbar?.showCurrency === false ? "8px" : "0",
        }}
      >
        <MainChartTypeSelect chart={props.chart} />
        <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange} />
        <IndicatorsButton chart={props.chart} />

        <RightSection
          style={{
            marginLeft: tc?.toolbar?.topMenuPosition === "right" ? "8px" : "0",
          }}
        >
          <AutoScaleSwitch chart={props.chart} />
          {renderChartScaleSwitch()}
          <Icons>
            <FullScreenButton mainContainer={props.mainContainer} />
            {renderShareChartButton()}
          </Icons>
        </RightSection>
      </LeftSection>
      {renderShowCurrency()}
    </Container>
  );
};
