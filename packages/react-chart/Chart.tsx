import React, {useLayoutEffect, useState } from "react";

import {Button} from "ui";
import { LeftMenu } from "./src/LeftMenu";
import { TopMenu } from "./src/TopMenu";
interface ChartComponentProps {
  chart: any
  children?: JSX.Element,
}

const ChartComponent = (props: ChartComponentProps) => {

    return   (<div style={{ position: "relative", width: "100%", height: "100%", maxHeight: "100%", maxWidth: "100%" }}>
      <TopMenu chart={props.chart} />
      <LeftMenu chart={props.chart} />
      {props.children}
  </div>);
};

export { ChartComponent };
