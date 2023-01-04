import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
    min-width: 600px;
    max-width: 100%;
    min-height: 100px;
    max-height: 100%;
    color: white;
    background-color: #201E3E;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 8px 8px 24px 0px rgba(0, 0, 0, 1);
`

interface DialogContainerProps {
  children?: JSX.Element|JSX.Element[]|string;
  style?: React.CSSProperties;
}

export const DialogContainer = (props: DialogContainerProps) => {
  return (
    <Container style={props.style}>
      {props.children}
    </Container>
  );
};
