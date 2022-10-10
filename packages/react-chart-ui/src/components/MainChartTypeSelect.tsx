import * as React from "react";
import { useState } from "react";
import { ButtonSelect } from "ui";

interface MainChartTypeSelectProps {
  chart: any;
  style?: React.CSSProperties;
}

export const MainChartTypeSelect = (props: MainChartTypeSelectProps) => {
    const types = ["OHLC", "Bars", "Line", "Histogram", "Line and Histogram"];

  return (
        <ButtonSelect
          options={types}
          onSelect={(option) => {
            props.chart.setMainDrawMode(option);
          }}
          selectedOption='OHLC'
        />
  );
};
