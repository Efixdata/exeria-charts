import React from "react";
import { RefObject } from "react";
import styled from "styled-components";
import { LeftMenu } from "./components/LeftMenu";
import { TopMenu } from "./components/TopMenu";
import ContainerOffsetContext from "./contexts/ContainerOffsetContext";

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
  containerOffset: { offsetTop?: number, offsetBottom?: number };
  props: ChartUIProps;

  constructor(props: ChartUIProps) {
    super(props);
    this.props = props;
    this.containerRef = React.createRef();
    this.containerOffset = {};
  }

  componentDidMount() {
    setBoundingClientRect(this.containerRef, this.containerOffset);

    // if (typeof window !== undefined) {
    //   window.addEventListener('resize', setBoundingClientRect.bind(this))
    // }
  }
  componentDidUpdate() {
    setBoundingClientRect(this.containerRef, this.containerOffset);
  }

  render() {
    const leftMenuWidth = this.props.leftMenuWidth ? this.props.leftMenuWidth : "41px";
    const topMenuHeight = this.props.topMenuHeight ? this.props.topMenuHeight : "41px";

    return (
      <Container ref={this.containerRef} className="UI-container">
        <WrapperOuter className="wrapperOuter">
          <ContainerOffsetContext.Provider value={this.containerOffset}>
            <TopMenu chart={this.props.chart} style={{ height: topMenuHeight }} mainContainer={this.containerRef} onIntervalChange={this.props.onIntervalChange}/>
            <WrapperInner className="wrapperInner">
              <LeftMenu chart={this.props.chart} style={{ width: leftMenuWidth }} />
              <div style={{ position: 'absolute', inset: '41px 0 0 41px' }}>{this.props.children}</div>
            </WrapperInner>
          </ContainerOffsetContext.Provider>
        </WrapperOuter>
      </Container>
    );
  }
}

function setBoundingClientRect(containerRef : RefObject<HTMLDivElement>, containerOffset : any) {
  const boundingClientRect = containerRef.current?.getBoundingClientRect();
  console.log('changed the size', boundingClientRect);

  if (boundingClientRect) {
    containerOffset.top = boundingClientRect.y
    containerOffset.bottom = boundingClientRect.bottom
  }
}

export { ChartUI };
