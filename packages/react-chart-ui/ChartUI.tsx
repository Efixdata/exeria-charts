import React, { useLayoutEffect, useState } from "react";
import styled from "styled-components";
import { Button } from "ui";
import { LeftMenu } from "./src/components/LeftMenu";
import { TopMenu } from "./src/components/TopMenu";
interface ChartUIProps {
  chart: any;
  children?: React.ReactNode;
  leftMenuWidth?: string;
  topMenuHeight?: string;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  maxheight: 100%;
  maxwidth: 100%;
  display: flex;
  flex-direction: column;
  font-family: Mulish, Roboto, sans-serif;
  font-size: 13px;
`;

const ChartUI = (props: ChartUIProps) => {
  const leftMenuWidth = props.leftMenuWidth ? props.leftMenuWidth : "50px";
  const topMenuHeight = props.topMenuHeight ? props.topMenuHeight : "50px";

  return (
    <Container>
      <TopMenu chart={props.chart} style={{ height: topMenuHeight }} />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flexGrow: "1",
          maxHeight: `calc(100% - ${topMenuHeight}`,
        }}
      >
        <LeftMenu chart={props.chart} style={{ width: leftMenuWidth }} />
        <div style={{ flexGrow: "1" }}>{props.children}</div>
      </div>
    </Container>
  );
};

export { ChartUI };
