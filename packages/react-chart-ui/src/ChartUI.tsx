import { AlignRightSimple } from "phosphor-react";
import React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu";
import { TopMenu } from "./components/TopMenu";
import ContainerOffsetContext from "./contexts/ContainerOffsetContext";
import {Theme, ThemeObject} from "ui";

interface ChartUIProps {
  chart: any;
  children?: JSX.Element|JSX.Element[];
  leftMenuWidth?: string;
  topMenuHeight?: string;
  loading?: boolean;
  onIntervalChange?: (symbol: string) => void;
  theme?: ThemeObject;
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
    const leftMenuWidth = this.props.leftMenuWidth ? this.props.leftMenuWidth : "41px";
    const topMenuHeight = this.props.topMenuHeight ? this.props.topMenuHeight : "41px";

    return (
      <Theme theme={this.props.theme}>
        <Container ref={this.containerRef} className="UI-container">
          <WrapperOuter className="wrapperOuter">
            <ContainerOffsetContext.Provider value={this.containerOffset}>
              <TopMenu chart={this.props.chart} style={{ height: topMenuHeight }} mainContainer={this.containerRef} onIntervalChange={this.props.onIntervalChange} />
              <WrapperInner className="wrapperInner" height={`calc(100% - ${topMenuHeight})`}>
                <LeftMenu chart={this.props.chart} style={{ width: leftMenuWidth }} />
                <div style={{ position: 'absolute', inset: `${topMenuHeight} 0 0 ${leftMenuWidth}` }}>{this.props.children}</div>
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
