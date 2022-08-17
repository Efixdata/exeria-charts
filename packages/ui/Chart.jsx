import React, {useLayoutEffect } from "react";
import data from "./data";
import Chart from "chart";
import {Button} from "ui";


const ChartComponent = () => {
  let objectRef = React.createRef();

  useLayoutEffect(() => {
      const containerElement = objectRef.current;
      // @ts-ignore
      containerElement.style.width = "100%";
      // @ts-ignore
      containerElement.style.height = "450px";
      // @ts-ignore
      containerElement.style.position = "relative";
  
      const chart = new Chart({
        container: containerElement,
      });
      chart.init();
      chart.setMainSeriesData(data.candles);
    });


  return (
  <div style={{ position: "relative" }}>
    <div ref={objectRef} />
    <div style={{ position: "absolute", top: 0 }}>
    <Button />
    </div>
  </div>
  );
};

export { ChartComponent };
