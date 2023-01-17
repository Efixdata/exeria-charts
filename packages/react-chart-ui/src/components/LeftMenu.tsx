import * as React from "react";
import styled from "styled-components";
import { Cursors } from "./Cursors";
import { DrawingTools } from "./DrawingTools";

const Wrapper = styled.div`
  width: 300px;
  border: 2px solid blue;
  overflow: auto;
  z-index: 1;
  border: 2px solid blue;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;

  -ms-overflow-style: none;  /* Internet Explorer 10+ */
  scrollbar-width: none;  /* Firefox */
  &::-webkit-scrollbar { 
      display: none;  /* Safari and Chrome */
  }
`

const Container = styled.div`
  box-sizing: border-box;
  background-color: #100c22;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: auto;
  min-height: 100%;
  padding: 8px 0 8px 8px;
  grid-gap: 12px;
  pointer-events: auto;
`

interface LeftMenuProps {
    chart: any;
    style?: React.CSSProperties
}


export const LeftMenu = (props: LeftMenuProps) => {
  // @ts-ignore
  return (
    <Wrapper className="wrapper" onWheel={e => {
      console.log('EVENT captured!', e.target);
      e.stopPropagation();
    }}>
      <Container style={props.style} onWheel={passWheelEventToParent} onDrag={passDragEventToParent}>
        <Cursors chart={props.chart}/>
        <DrawingTools chart={props.chart}/>
      </Container>
    </Wrapper>
  )

  // Because parent has pointer-events set to none, but scrolling it should be possible
  function passWheelEventToParent(e : React.WheelEvent) {
    const wrapper = e.currentTarget?.parentElement;
    const nativeEvent : WheelEvent = e.nativeEvent;
    console.log('EVENT', wrapper?.scrollTop)
    if (wrapper) wrapper.scrollTo({
      top: wrapper.scrollTop += nativeEvent.deltaY,
      behavior: 'smooth'
    });
  }

  function passDragEventToParent(e : React.DragEvent) {
    const wrapper = e.currentTarget?.parentElement;
    const nativeEvent : DragEvent = e.nativeEvent;
    console.log('EVENT', nativeEvent)
  }
};
