import * as React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu/LeftMenu";
import { TopMenu } from "./components/TopMenu/TopMenu";
import ContainerOffsetContext from "./contexts/ContainerOffsetContext";
import { Theme } from "ui";
import type {
  ChartUIMobileLayout,
  ChartUITheme,
  NullableChartInstance,
  ShareConfig,
} from "./chartTypes";
import {
  applyChartUiEnvironmentOptions,
  getChartUiSafeAreaPadding,
  isChartUiFullscreenElement,
  syncChartInstanceLayout,
} from "./utils/chartUiMobile";
import { ChartUiSettingsContext } from "./contexts/ChartUiSettingsContext";
import { mergeChartUiTheme } from "./utils/mergeChartUiTheme";
import { DEFAULT_CHART_UI_THEME } from "./components/TopMenu/ChartSettings/chartSettingsPresets";
import { getUILayoutCssVars } from "ui/designTokens";
import { getChartEnvironment, subscribeChartEnvironment } from "@efixdata/exeria-chart";
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
  /** Compact toolbar density; `minimal` hides secondary groups (e.g. indicators) on narrow layouts. */
  mobileLayout?: ChartUIMobileLayout;
  /** Viewport width (px) at which compact layout activates. Defaults to UI toolbar breakpoint (600). */
  compactBreakpoint?: number;
}

const Container = styled.div`
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: ${UI_FONT_FAMILY};
  font-size: var(--ui-font-body, 13px);
  user-select: none;
  touch-action: manipulation;
  contain: layout style;

  &.UI-container--fullscreen {
    min-height: 100dvh;
    min-height: -webkit-fill-available;
  }
`;

const ToolbarRow = styled.div`
  position: relative;
  z-index: 30;
  flex-shrink: 0;
  display: flex;
  width: 100%;
  justify-content: flex-end;
  padding-right: 8px;
  box-sizing: border-box;
  pointer-events: auto;

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
  overscroll-behavior: contain;
`;

const WrapperInner = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`;

/** Compact: rail overlays chart edge; chart area keeps full wrapper width and insets via padding. */
const LeftMenuOverlay = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 20;
  width: var(--ui-left-menu-width, 44px);
  overflow: hidden;
  pointer-events: auto;
`;

const LeftMenuColumn = styled.div`
  position: relative;
  z-index: 20;
  flex: 0 0 var(--ui-left-menu-width, 44px);
  width: var(--ui-left-menu-width, 44px);
  min-width: 0;
  overflow: hidden;
  min-height: 0;
  height: 100%;
`;

const ChartArea = styled.div`
  position: relative;
  flex: 1;
  width: 100%;
  min-width: 0;
  min-height: 0;
  box-sizing: border-box;
  overflow: hidden;
  overscroll-behavior: contain;
`;

interface ChartUIState {
  uiThemeOverride: Partial<ChartUITheme> | null;
  isCompact: boolean;
  drawingToolsVisible: boolean;
  isFullscreen: boolean;
}

class ChartUI extends React.Component<ChartUIProps, ChartUIState> {
  containerRef: RefObject<HTMLDivElement>;
  wrapperOuterRef: RefObject<HTMLDivElement>;
  containerOffset: { offsetTop?: number; offsetBottom?: number };
  private environmentUnsubscribe?: () => void;
  private layoutResizeObserver?: ResizeObserver;
  private fullscreenLayoutTimers: number[] = [];

  constructor(props: ChartUIProps) {
    super(props);
    this.containerRef = React.createRef();
    this.wrapperOuterRef = React.createRef();
    this.containerOffset = {};
    this.state = {
      uiThemeOverride: null,
      isCompact: typeof window !== "undefined" ? getChartEnvironment().isCompact : false,
      drawingToolsVisible: false,
      isFullscreen: false,
    };
  }

  syncChartLayout = () => {
    syncChartInstanceLayout(this.props.chart);
  };

  notifyChartLayoutChange = () => {
    requestAnimationFrame(() => {
      this.syncChartLayout();
    });
  };

  toggleDrawingTools = () => {
    this.setState((previous) => ({
      drawingToolsVisible: !previous.drawingToolsVisible,
    }));
  };

  applyUiTheme = (patch: Partial<ChartUITheme>) => {
    this.setState((prev) => ({
      uiThemeOverride: mergeChartUiTheme(prev.uiThemeOverride ?? {}, patch) ?? patch,
    }));
  };

  override componentDidMount() {
    applyChartUiEnvironmentOptions({ compactBreakpoint: this.props.compactBreakpoint });
    this.setBoundingClientRect();
    this.syncChartLayoutMode();

    this.environmentUnsubscribe = subscribeChartEnvironment(() => {
      const isCompact = getChartEnvironment().isCompact;
      this.setState((previous) => ({
        isCompact,
        drawingToolsVisible: isCompact ? previous.drawingToolsVisible : true,
      }));
      this.syncChartLayoutMode();
    });

    if (typeof window !== "undefined") {
      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "msfullscreenchange",
      ].forEach((event) => {
        window.addEventListener(event, this.handleFullscreenChange);
      });

      if (this.wrapperOuterRef.current && typeof ResizeObserver !== "undefined") {
        this.layoutResizeObserver = new ResizeObserver(() => {
          this.syncChartLayout();
        });
        this.layoutResizeObserver.observe(this.wrapperOuterRef.current);
      }

      window.visualViewport?.addEventListener("resize", this.handleViewportResize);
      window.visualViewport?.addEventListener("scroll", this.handleViewportResize);
    }
  }

  override componentDidUpdate(prevProps: ChartUIProps) {
    this.setBoundingClientRect();

    if (prevProps.compactBreakpoint !== this.props.compactBreakpoint) {
      applyChartUiEnvironmentOptions({ compactBreakpoint: this.props.compactBreakpoint });
    }

    if (prevProps.chart !== this.props.chart || prevProps.mobileLayout !== this.props.mobileLayout) {
      this.syncChartLayoutMode();
    }
  }

  syncChartLayoutMode = () => {
    this.props.chart?.setLayoutMode?.("auto");
    this.syncChartLayout();
  };

  override componentWillUnmount() {
    this.environmentUnsubscribe?.();
    this.layoutResizeObserver?.disconnect();
    this.clearFullscreenLayoutTimers();

    window.visualViewport?.removeEventListener("resize", this.handleViewportResize);
    window.visualViewport?.removeEventListener("scroll", this.handleViewportResize);

    if (typeof window !== "undefined") {
      [
        "fullscreenchange",
        "webkitfullscreenchange",
        "mozfullscreenchange",
        "msfullscreenchange",
      ].forEach((event) => {
        window.removeEventListener(event, this.handleFullscreenChange);
      });
    }
  }

  override render() {
    const resolvedTheme = mergeChartUiTheme(
      DEFAULT_CHART_UI_THEME,
      mergeChartUiTheme(this.props.theme, this.state.uiThemeOverride),
    );
    const isCompact = this.state.isCompact;
    const drawingToolsVisible = isCompact ? this.state.drawingToolsVisible : true;
    const useCompactDrawingRail = isCompact && drawingToolsVisible;
    const gap = isCompact ? 0 : resolvedTheme?.gap || 0;
    const edgeInset = resolvedTheme?.edgeInset || 0;
    const mobileLayout = this.props.mobileLayout ?? "default";
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
            className={`UI-container${this.state.isFullscreen ? " UI-container--fullscreen" : ""}`}
            style={{
              ...getChartUiSafeAreaPadding(edgeInset),
              ...(surroundBackground ? { backgroundColor: surroundBackground } : undefined),
              ...getUILayoutCssVars(),
            }}
          >
            <DrawingEditListener chart={this.props.chart} />
            <ToolbarRow className={topMenuPosition === "right" && !isCompact ? "" : "fullWidth"}>
              <TopMenu
                chart={this.props.chart}
                compact={topMenuPosition === "right"}
                style={topMenuStyles}
                mainContainer={this.containerRef}
                onIntervalChange={this.props.onIntervalChange}
                shareConfig={this.props.shareConfig}
                drawingToolsVisible={drawingToolsVisible}
                onToggleDrawingTools={this.toggleDrawingTools}
                mobileLayout={mobileLayout}
              />
            </ToolbarRow>
            <WrapperOuter ref={this.wrapperOuterRef} className="wrapperOuter">
              <ContainerOffsetContext.Provider value={this.containerOffset}>
                <WrapperInner className="wrapperInner">
                  {useCompactDrawingRail ? (
                    <LeftMenuOverlay>
                      <LeftMenu chart={this.props.chart} />
                    </LeftMenuOverlay>
                  ) : null}
                  {!isCompact && drawingToolsVisible ? (
                    <LeftMenuColumn style={{ marginRight: gap }}>
                      <LeftMenu chart={this.props.chart} />
                    </LeftMenuColumn>
                  ) : null}
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

  clearFullscreenLayoutTimers = () => {
    this.fullscreenLayoutTimers.forEach((timerId) => window.clearTimeout(timerId));
    this.fullscreenLayoutTimers = [];
  };

  scheduleFullscreenLayoutSync = () => {
    this.clearFullscreenLayoutTimers();
    this.setBoundingClientRect();
    this.syncChartLayout();
    requestAnimationFrame(() => this.syncChartLayout());

    for (const delay of [50, 150, 350]) {
      this.fullscreenLayoutTimers.push(
        window.setTimeout(() => {
          this.setBoundingClientRect();
          this.syncChartLayout();
        }, delay),
      );
    }
  };

  handleViewportResize = () => {
    this.setBoundingClientRect();
    this.syncChartLayout();
  };

  handleFullscreenChange = () => {
    this.setState({
      isFullscreen: isChartUiFullscreenElement(this.containerRef.current),
    });
    this.scheduleFullscreenLayoutSync();
  };
}

export type { ChartUIMobileLayout };

export { ChartUI };
