import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
    min-width: 600px;
    max-width: 100%;
    min-height: 100px;
    max-height: 100%;
    color: white;
    background-color: #1D1D3A;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 8px 8px 24px 0px rgba(0, 0, 0, 1);
`

const Header = styled.div`
    background-color: #100c22;
    padding: 30px;
    border-bottom: 1px solid #201e3e;
`
const Body = styled.div`
    height: 500px;
    max-height: 100%;
    overflow-y: auto;
`

interface DialogBoxProps {
  children?: JSX.Element|JSX.Element[]|string;
  style?: React.CSSProperties;
  onClose: () => void;
  title?: string;
}

export const DialogBox = (props: DialogBoxProps) => {
  return (
    <Container style={props.style}>
        <Header>{props.title}</Header>
        <Body>
            {props.children}
        </Body>
    </Container>
  );
};
