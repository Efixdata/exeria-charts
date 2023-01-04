import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
    display: flex;
    flex-direction: column;
`;

const Title = styled.div`
    font-size: 14px;
    font-weight: 600;
`;

const Subtitle = styled.div`
    font-size: 13px;
    opacity: 0.7;
`;


interface HeadlineProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  title: string
  subtitle?: string;
}

export const Headline = (props: HeadlineProps) => {

  const renderSubtitle = () => {
    if (props.subtitle) {
      return <Subtitle>{props.subtitle}</Subtitle>
    }
  }

  return <Container style={props.style}>
    <Title>{props.title}</Title>
    {renderSubtitle()}
    {props.children}
  </Container>;
};
