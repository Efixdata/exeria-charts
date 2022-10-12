import React from "react";
import styled from "styled-components";
import { LeftMenu } from "./src/components/LeftMenu";
import { TopMenu } from "./src/components/TopMenu";

interface ChartUIProps {
  chart: any;
  children?: React.ReactNode;
  leftMenuWidth?: string;
  topMenuHeight?: string;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  maxheight: 100%;
  maxwidth: 100%;
  display: flex;
  flex-direction: column;
  font-family: Mulish, Roboto, sans-serif;
  font-size: 13px;
`;

class ChartUI extends React.Component {
  containerRef;
  props: ChartUIProps;

  constructor(props: ChartUIProps) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
  }

  render() {
    const leftMenuWidth = this.props.leftMenuWidth ? this.props.leftMenuWidth : "50px";
    const topMenuHeight = this.props.topMenuHeight ? this.props.topMenuHeight : "50px";

    return (
      <Container ref={this.containerRef}>
        <TopMenu chart={this.props.chart} style={{ height: topMenuHeight }} mainContainer={this.containerRef}/>
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
