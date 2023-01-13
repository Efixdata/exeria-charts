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
        <TopMenu chart={this.props.chart} style={{ height: topMenuHeight }} mainContainer={this.containerRef} onIntervalChange={this.props.onIntervalChange}/>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flexGrow: "1",
            maxHeight: `calc(100% - ${topMenuHeight}`,
            maxWidth: '100%'
          }}
        >
          <LeftMenu chart={this.props.chart} style={{ width: leftMenuWidth }} />
          <div style={{ flexGrow: "1", maxWidth: `calc(100% - ${leftMenuWidth})` }}>{this.props.children}</div>
        </div>
      </Container>
    );
  }
}

export { ChartUI };
