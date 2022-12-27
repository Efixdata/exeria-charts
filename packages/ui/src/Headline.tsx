import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.div`
    font-size: 1.2em;
    font-weight: bold;
`;

const Subtitle = styled.div`
    opacity: 0.7;
`;


interface HeadlineProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  title: string
  subtitle?: string;
}

export const Headline = (props: HeadlineProps) => {

  return <Container style={props.style}>
    <Title>{props.title}</Title>
    {props.subtitle || <Subtitle>props.subtitle</Subtitle>}
    {props.children}
  </Container>;
};
