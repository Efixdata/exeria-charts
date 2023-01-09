import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;

    @media (min-width: 600px) {
      flex-direction: column;
      width: 600px;
      max-width: 90vh;
      height: 600px;
      max-height: 90vh;
      border-radius: 6px;
    }

    color: white;
    background-color: #201E3E;
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
