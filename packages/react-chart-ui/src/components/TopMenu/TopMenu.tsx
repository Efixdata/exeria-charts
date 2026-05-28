import * as React from "react";
import { useContext } from "react";
import styled, { ThemeContext } from "styled-components";
import { ChartScaleSwitch } from "./ChartScaleSwitch";
import { ChartSettingsButton } from "./ChartSettings/ChartSettingsButton";
import { AutoScaleSwitch } from "./AutoScaleSwitch";
import { MainChartTypeSelect } from "./MainChartTypeSelect";
import { FullScreenButton } from "./FullScreenButton";
import { CurrencySwitch } from "./CurrencySwitch";
import { IntervalSwitch } from "./IntervalSwitch";
import { ShareChartButton } from "./ShareChartButton";
import { IndicatorsButton } from "./Indicators/IndicatorsButton";
import type { NullableChartInstance, ShareConfig } from "../../chartTypes";
import toolbarStyles from "../toolbar/toolbarLayout.module.css";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface TopMenuProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties | undefined;
  mainContainer: React.RefObject<HTMLElement>;
  onIntervalChange?: ((symbol: string) => void) | undefined;
  compact?: boolean | undefined;
  shareConfig?: ShareConfig | undefined;
}

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: var(--ui-space-2, 8px);
  gap: var(--ui-toolbar-group-gap, 12px);
  background: ${(props) => props.theme.toolbar.background};
  width: ${(props) => (props.$compact ? "fit-content" : "100%")};
  max-width: 100%;
`;

export const TopMenu = (props: TopMenuProps) => {
  // @ts-ignore - styled-components ThemeContext type mismatch with React.useContext
  const tc = useContext(ThemeContext);
  const t = useChartTranslate(props.chart);
  const compact = props.compact ?? true;

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
    <Container
      $compact={compact}
      style={props.style}
      role="toolbar"
      aria-label={t("toolbar_chart_toolbar", "Chart toolbar")}
    >
      <div className={toolbarStyles.toolbarRow} style={{ flex: compact ? "0 1 auto" : "1 1 auto" }}>
        <div className={toolbarStyles.toolbarGroup} role="group" aria-label="Chart type and interval">
          <MainChartTypeSelect chart={props.chart} />
          <IntervalSwitch chart={props.chart} onIntervalChange={props.onIntervalChange} />
        </div>

        <div className={toolbarStyles.toolbarDivider} aria-hidden="true" />

        <div className={toolbarStyles.toolbarGroup} role="group" aria-label="Indicators">
          <IndicatorsButton chart={props.chart} />
        </div>

        <div className={toolbarStyles.toolbarGroupActions}>
          <div className={toolbarStyles.toolbarGroup} role="group" aria-label="Scale">
            <AutoScaleSwitch chart={props.chart} />
          </div>

          <div className={toolbarStyles.toolbarDivider} aria-hidden="true" />

          <div className={toolbarStyles.toolbarGroup} role="group" aria-label="Chart actions">
            {renderChartScaleSwitch()}
            <ChartSettingsButton chart={props.chart} />
            <FullScreenButton chart={props.chart} mainContainer={props.mainContainer} />
            {renderShareChartButton()}
          </div>
        </div>
      </div>
      {renderShowCurrency()}
    </Container>
  );
};
