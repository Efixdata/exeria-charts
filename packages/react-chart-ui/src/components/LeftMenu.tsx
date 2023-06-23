import * as React from "react";
import styled from "styled-components";
import { Cursors } from "./Cursors";
import { DrawingTools } from "./DrawingTools";

const Container = styled.div`
  box-sizing: border-box;
  background: ${props => props.theme.toolbar.background || "#100c22"};
  border-right: ${props => props.theme.border.inner || "none"};
  border-left: ${props => props.theme.border.outter || "none"};
  border-bottom: ${props => props.theme.border.outter || "none"};
  border-top: ${props => props.theme.border.outter || "none"};
  border-radius: ${props => props.theme.border.radius + 'px' || 0};
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: max-content;
  min-height: calc(100% - 17px);
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  z-index: 1;
`

interface LeftMenuProps {
    chart: any;
    style?: React.CSSProperties;
}


export const LeftMenu = (props: LeftMenuProps) => {
  // @ts-ignore
  return (
    <Container style={props.style}>
      <Cursors chart={props.chart}/>
      <DrawingTools chart={props.chart}/>
    </Container>
  )
};
