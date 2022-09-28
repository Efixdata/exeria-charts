/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import styled from "styled-components";
import { IconButton, TextButton } from "ui";

interface ChartScaleSwitchProps {
    chart: any;
    style?: React.CSSProperties;
}

const Container = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  return (
    <Container style={props.style}>
      <TextButton style={{ color: "#7f9dcc" }}>lin</TextButton>
      <TextButton style={{ color: "#7f9dcc" }}>log</TextButton>
      <TextButton style={{ color: "#7f9dcc" }}>%</TextButton>
    </Container>
  );
};
