import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
  background-color: #100c22
`

interface LeftMenuProps {
    chart: any;
    style?: React.CSSProperties
}


export const LeftMenu = (props: LeftMenuProps) => {
  return <Container style={props.style}>left menu</Container>;
};
