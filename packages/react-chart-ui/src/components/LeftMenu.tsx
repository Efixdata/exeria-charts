import * as React from "react";
import styled from "styled-components";
import { Cursors } from "./Cursors";
import { DrawingTools } from "./DrawingTools";

const Container = styled.div`
  box-sizing: border-box;
  background-color: #100c22;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow: visible;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
`

interface LeftMenuProps {
    chart: any;
    style?: React.CSSProperties
}


export const LeftMenu = (props: LeftMenuProps) => {
  return <Container style={props.style}>
    <Cursors chart={props.chart}/>
    <DrawingTools chart={props.chart}/>
  </Container>;
};
