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
  font-family: Mulish, Roboto, sans-serif;
  font-size: 13px;
  user-select: none;
`;

const ToolbarRow = styled.div`
  position: relative;
  z-index: 5;
  flex-shrink: 0;
`;

const WrapperOuter = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

const WrapperInner = styled.div<{ height: string }>`
  display: flex;
  flexdirection: row;
  flexgrow: 1;
  height: ${(props) => props.height};
  width: 100%;
  overflow-y: auto;

  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
`;

interface ChartUIState {
  uiThemeOverride: Partial<ChartUITheme> | null;
}

class ChartUI extends React.Component<ChartUIProps, ChartUIState> {
  containerRef: RefObject<HTMLDivElement>;
  containerOffset: { offsetTop?: number; offsetBottom?: number };

  constructor(props: ChartUIProps) {
    super(props);
    this.containerRef = React.createRef();
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
    const resolvedTheme = mergeChartUiTheme(this.props.theme, this.state.uiThemeOverride);
    const gap = resolvedTheme?.gap || 0;
    const edgeInset = resolvedTheme?.edgeInset || 0;
    const borders =
      (resolvedTheme?.border?.inner ? 1 : 0) + (resolvedTheme?.border?.outter ? 1 : 0);
    const leftMenuWidth = (this.props.leftMenuWidth || 42) + borders;
    const topMenuHeight = (this.props.topMenuHeight || 42) + borders;
    let topMenuStyles: any = {
      height: topMenuHeight,
      marginBottom: gap,
    };
    const surroundBackground = resolvedTheme?.surroundBackground;

    return (
      <ChartUiSettingsContext.Provider value={{ applyUiTheme: this.applyUiTheme }}>
        <Theme theme={resolvedTheme}>
          <Container
            ref={this.containerRef}
            className="UI-container"
            style={{
              ...(edgeInset > 0 ? { padding: edgeInset } : undefined),
              ...(surroundBackground ? { backgroundColor: surroundBackground } : undefined),
            }}
          >
          <DrawingEditListener chart={this.props.chart} />
          <ToolbarRow>
            <TopMenu
              chart={this.props.chart}
              className={resolvedTheme?.toolbar?.topMenuPosition === "right" ? "right" : ""}
              style={topMenuStyles}
              mainContainer={this.containerRef}
              onIntervalChange={this.props.onIntervalChange}
              shareConfig={this.props.shareConfig}
            />
          </ToolbarRow>
          <WrapperOuter className="wrapperOuter">
            <ContainerOffsetContext.Provider value={this.containerOffset}>
              <WrapperInner className="wrapperInner" height="100%">
                <LeftMenu
                  chart={this.props.chart}
                  style={{ width: leftMenuWidth, marginRight: gap }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: `${topMenuHeight + gap + "px"} 0 0 ${leftMenuWidth + gap + "px"}`,
                  }}
                >
                  {this.props.children}
                </div>
              </WrapperInner>
            </ContainerOffsetContext.Provider>
          </WrapperOuter>
          </Container>
        </Theme>
      </ChartUiSettingsContext.Provider>
    );
  }

  setBoundingClientRect = () => {
    const boundingClientRect = this.containerRef.current?.getBoundingClientRect();

    if (boundingClientRect) {
      this.containerOffset.offsetBottom = boundingClientRect.bottom;
      this.containerOffset.offsetTop = boundingClientRect.top;
    }
  };
}

export { ChartUI };
