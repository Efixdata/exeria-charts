import { AlignRightSimple } from "phosphor-react";
import React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu/LeftMenu";
import { TopMenu } from "./components/TopMenu/TopMenu";
import ContainerOffsetContext from "./contexts/ContainerOffsetContext";
import {Theme, ThemeInterface} from "ui";

interface ChartUIProps {
  chart: any;
  children?: JSX.Element|JSX.Element[];
  leftMenuWidth?: number;
  topMenuHeight?: number;
  loading?: boolean;
  onIntervalChange?: (symbol: string) => void;
  theme?: ThemeInterface;
}

const Container = styled.div`
  position: relative;
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

const WrapperOuter = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
`

const WrapperInner = styled.div<{height: string}>`
  display: flex;
  flexDirection: row;
  flexGrow: 1;
  height: ${props => props.height};
  width: 100%;
  overflow-y: auto;

  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
  &::-webkit-scrollbar { 
      display: none;  /* Safari and Chrome */
  }
`

class ChartUI extends React.Component {
  containerRef: RefObject<HTMLDivElement>;
  containerOffset: { offsetTop?: number, offsetBottom?: number };
  props: ChartUIProps;

  constructor(props: ChartUIProps) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
    this.containerOffset = {};
  }

  componentDidMount() {
    this.setBoundingClientRect();

    if (typeof window !== 'undefined') {
      ["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"].forEach(event => {
        window.addEventListener(event, this.setBoundingClientRect)
      })
    }
  }

  componentDidUpdate() {
    this.setBoundingClientRect();
  }

  render() {
    const gap = this.props.theme?.gap || 0;
    const borders = (this.props.theme?.border?.inner ? 1 : 0) + (this.props.theme?.border?.outter ? 1 : 0);
    const leftMenuWidth = (this.props.leftMenuWidth || 42) + borders;
    const topMenuHeight = (this.props.topMenuHeight || 42) + borders;

    return (
      <Theme theme={this.props.theme}>
        <Container ref={this.containerRef} className="UI-container">
          <WrapperOuter className="wrapperOuter">
            <ContainerOffsetContext.Provider value={this.containerOffset}>
              <TopMenu chart={this.props.chart} style={{ height: topMenuHeight, marginBottom: gap }} mainContainer={this.containerRef} onIntervalChange={this.props.onIntervalChange} />
              <WrapperInner className="wrapperInner" height={`calc(100% - ${topMenuHeight + gap + 'px'})`}>
                <LeftMenu chart={this.props.chart} style={{ width: leftMenuWidth, marginRight: gap }} />
                <div style={{ position: 'absolute', inset: `${topMenuHeight + gap + 'px'} 0 0 ${leftMenuWidth + gap + 'px'}` }}>{this.props.children}</div>
              </WrapperInner>
            </ContainerOffsetContext.Provider>
          </WrapperOuter>
        </Container>
      </Theme>
    );
  }

  setBoundingClientRect = () => {
    const boundingClientRect = this.containerRef.current?.getBoundingClientRect();
  
    if (boundingClientRect) {
      this.containerOffset.offsetBottom = boundingClientRect.bottom;
      this.containerOffset.offsetTop = boundingClientRect.top;
    }
  }
}

export { ChartUI };
