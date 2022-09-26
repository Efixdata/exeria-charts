import React, {useLayoutEffect, useState } from "react";

import {Button} from "ui";
import { LeftMenu } from "./src/components/LeftMenu";
import { TopMenu } from "./src/components/TopMenu";
interface ChartUIProps {
  chart: any
  children?: JSX.Element,
  leftMenuWidth?: string,
  topMenuHeight?: string
}

const ChartUI = (props: ChartUIProps) => {

  const leftMenuWidth = props.leftMenuWidth ? props.leftMenuWidth : "50px";
  const topMenuHeight = props.topMenuHeight ? props.topMenuHeight : "50px";

    return   (<div style={{ position: "relative", width: "100%", height: "100%", maxHeight: "100%", maxWidth: "100%", display: "flex", flexDirection: "column" }}>
      <TopMenu chart={props.chart} style={{ height: topMenuHeight }}/>
      <div style={{ display: "flex", flexDirection: "row", flexGrow: "1", maxHeight: `calc(100% - ${topMenuHeight}`}}>
        <LeftMenu chart={props.chart} style={{ width: leftMenuWidth }}/>
        <div style={{ flexGrow: "1" }}>
          {props.children}
        </div>
      </div>
  </div>);
};

export { ChartUI };
