import * as React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu/LeftMenu";
import { TopMenu } from "./components/TopMenu/TopMenu";
import ContainerOffsetContext from "./contexts/ContainerOffsetContext";
import { Theme } from "ui";
import type { ChartUITheme, NullableChartInstance, ShareConfig } from "./chartTypes";
import { ChartUiSettingsContext } from "./contexts/ChartUiSettingsContext";
import { mergeChartUiTheme } from "./utils/mergeChartUiTheme";
import { DEFAULT_CHART_UI_THEME } from "./components/TopMenu/ChartSettings/chartSettingsPresets";
import { getUILayoutCssVars } from "ui/designTokens";
import { UI_FONT_FAMILY } from "ui/theme";
import "./fonts.css";
import { DrawingEditListener } from "./components/TopMenu/DrawingEdit/DrawingEditListener";

interface ChartUIProps {
  chart: NullableChartInstance;
  children?: JSX.Element | JSX.Element[];
  leftMenuWidth?: number;
  topMenuHeight?: number;
  loading?: boolean;
  onIntervalChange?: (symbol: string) => void;
  theme?: ChartUITheme;
  shareConfig?: ShareConfig;
}

const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  font-family: ${UI_FONT_FAMILY};
  font-size: var(--ui-font-body, 13px);
  user-select: none;
`;

const ToolbarRow = styled.div`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  padding-right: 8px;
  box-sizing: border-box;

  &.fullWidth {
    justify-content: stretch;
    padding-right: 0;
  }
`;

const WrapperOuter = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const WrapperInner = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-height: 0;
`;

const LeftMenuColumn = styled.div`
  position: relative;
  z-index: 20;
  flex: 0 0 var(--ui-left-menu-width, 44px);
  width: var(--ui-left-menu-width, 44px);
  overflow: visible;
  min-height: 0;
  height: 100%;
`;

const ChartArea = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

interface ChartUIState {
  uiThemeOverride: Partial<ChartUITheme> | null;
}

class ChartUI extends React.Component<ChartUIProps, ChartUIState> {
  containerRef: RefObject<HTMLDivElement>;
  wrapperOuterRef: RefObject<HTMLDivElement>;
  containerOffset: { offsetTop?: number; offsetBottom?: number };

  constructor(props: ChartUIProps) {
    super(props);
    this.containerRef = React.createRef();
    this.wrapperOuterRef = React.createRef();
    this.containerOffset = {};
    this.state = {
      uiThemeOverride: null,
    };
  }

  applyUiTheme = (patch: Partial<ChartUITheme>) => {
    this.setState((prev) => ({
      uiThemeOverride: mergeChartUiTheme(prev.uiThemeOverride ?? {}, patch) ?? patch,
    }));
  };

  override componentDidMount() {
    this.setBoundingClientRect();

    if (typeof window !== "undefined") {
      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "msfullscreenchange",
      ].forEach((event) => {
        window.addEventListener(event, this.setBoundingClientRect);
      });
    }
  }

  override componentDidUpdate() {
    this.setBoundingClientRect();
  }

  override render() {
    const resolvedTheme = mergeChartUiTheme(
      DEFAULT_CHART_UI_THEME,
      mergeChartUiTheme(this.props.theme, this.state.uiThemeOverride),
    );
    const gap = resolvedTheme?.gap || 0;
    const edgeInset = resolvedTheme?.edgeInset || 0;
    const topMenuPosition = resolvedTheme?.toolbar?.topMenuPosition ?? "right";
    const surroundBackground = resolvedTheme?.surroundBackground;
    const topMenuStyles: React.CSSProperties = {
      marginBottom: gap,
    };

    return (
      <ChartUiSettingsContext.Provider value={{ applyUiTheme: this.applyUiTheme }}>
        <Theme theme={resolvedTheme}>
          <Container
            ref={this.containerRef}
            className="UI-container"
            style={{
              ...(edgeInset > 0 ? { padding: edgeInset } : undefined),
              ...(surroundBackground ? { backgroundColor: surroundBackground } : undefined),
              ...getUILayoutCssVars(),
            }}
          >
            <DrawingEditListener chart={this.props.chart} />
            <ToolbarRow className={topMenuPosition === "right" ? "" : "fullWidth"}>
              <TopMenu
                chart={this.props.chart}
                compact={topMenuPosition === "right"}
                style={topMenuStyles}
                mainContainer={this.containerRef}
                onIntervalChange={this.props.onIntervalChange}
                shareConfig={this.props.shareConfig}
              />
            </ToolbarRow>
            <WrapperOuter ref={this.wrapperOuterRef} className="wrapperOuter">
              <ContainerOffsetContext.Provider value={this.containerOffset}>
                <WrapperInner className="wrapperInner">
                  <LeftMenuColumn style={{ marginRight: gap }}>
                    <LeftMenu chart={this.props.chart} />
                  </LeftMenuColumn>
                  <ChartArea data-chart-area>{this.props.children}</ChartArea>
                </WrapperInner>
              </ContainerOffsetContext.Provider>
            </WrapperOuter>
          </Container>
        </Theme>
      </ChartUiSettingsContext.Provider>
    );
  }

  setBoundingClientRect = () => {
    const boundingClientRect = this.wrapperOuterRef.current?.getBoundingClientRect();

    if (boundingClientRect) {
      this.containerOffset.offsetBottom = boundingClientRect.bottom;
      this.containerOffset.offsetTop = boundingClientRect.top;
    }
  };
}

export { ChartUI };
