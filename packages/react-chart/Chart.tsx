import React, {useLayoutEffect, useState } from "react";
// @ts-ignore
import data from "./data";
// @ts-ignore
import Chart from "chart";
import {Button} from "ui";

interface Interval {
  symbol: string
}

interface Instrument {
  id: string
  symbol: string
  title: string
  name: string
  currency: string
  precision?: number
  chart?: string
  availableIntervals?: Interval[],
  interval?: Interval
}

interface ChartComponentProps {
  width?: string,
  maxWidth?:string,
  height?: string,
  maxHeight?: string,
  instrument?: Instrument
  candles?: any
}

const ChartComponent = (props: ChartComponentProps) => {
  let objectRef = React.createRef();

  let width = props.width ? props.width : "100%";
  let height = props.height ? props.height : "100%";
  let maxHeight = props.maxHeight ? props.maxHeight : "100%";
  let maxWidth = props.maxWidth ? props.maxWidth : "100%";

  useLayoutEffect(() => {
      const containerElement = objectRef.current;

      // @ts-ignore
      containerElement.style.width = width;
      // @ts-ignore
      containerElement.style.height = height;
      // @ts-ignore
      containerElement.style.maxHeight = maxHeight;
      // @ts-ignore
      containerElement.style.maxWidth = maxWidth;
      // @ts-ignore
      containerElement.style.position = "relative";
  
      const chart = new Chart({
        container: containerElement,
        instrument: props.instrument
      });

      chart.init();
      chart.setMainSeriesData(data.candles);
    });
    
    return   (<div style={{ position: "relative", width, height, maxHeight, maxWidth }}>
    {/* @ts-ignore */}  
    <div ref={objectRef} />
    <div style={{ position: "absolute", top: 0 }}>
    {/* <Button /> */}
    </div>
  </div>);
};

export { ChartComponent };
