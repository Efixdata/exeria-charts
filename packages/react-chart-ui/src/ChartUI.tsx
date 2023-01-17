import React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu";
import { TopMenu } from "./components/TopMenu";

interface ChartUIProps {
  chart: any;
  children?: JSX.Element|JSX.Element[];
  leftMenuWidth?: string;
  topMenuHeight?: string;
  loading?: boolean;
  onIntervalChange?: (symbol: string) => void;
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

const WrapperInner = styled.div`
  display: flex;
  flexDirection: row;
  flexGrow: 1;
  height: calc(100% - 41px);
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
  props: ChartUIProps;

  constructor(props: ChartUIProps) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
  }

  render() {
    const leftMenuWidth = this.props.leftMenuWidth ? this.props.leftMenuWidth : "41px";
    const topMenuHeight = this.props.topMenuHeight ? this.props.topMenuHeight : "41px";

    return (
      <Container ref={this.containerRef}>
        <WrapperOuter className="wrapperOuter">
          <TopMenu chart={this.props.chart} style={{ height: topMenuHeight }} mainContainer={this.containerRef} onIntervalChange={this.props.onIntervalChange}/>
          <WrapperInner className="wrapperInner">
            <LeftMenu chart={this.props.chart} style={{ width: leftMenuWidth }} />
            <div style={{ position: 'absolute', inset: '41px 0 0 41px' }}>{this.props.children}</div>
          </WrapperInner>
        </WrapperOuter>
      </Container>
    );
  }
}

export { ChartUI };
