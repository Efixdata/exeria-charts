import * as React from "react";
import styled from "styled-components";
import { DrawingTools } from "./DrawingTools";

const Container = styled.div`
  background-color: #100c22;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  max-height: 100%;
  overflow-y: auto;
`

interface LeftMenuProps {
    chart: any;
    style?: React.CSSProperties
}


export const LeftMenu = (props: LeftMenuProps) => {
  return <Container style={props.style}>
    <DrawingTools chart={props.chart}/>
  </Container>;
};
