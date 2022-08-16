import React, {useLayoutEffect } from "react";
import data from "./data";
import Chart from "chart";


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
  
      chart.setMainSeriesData(data);
      chart.init();
    });


  return (
      <div ref={objectRef} />
  );
};

export default ChartComponent;
