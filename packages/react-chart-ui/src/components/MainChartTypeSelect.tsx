import * as React from "react";
import { useState } from "react";
import { ChartHistogram, ChartLine, ChartBars, ChartCandles, ChartHistogramLine } from "../img/icons/chartTypes/index.js";
import { SelectButton, TextButton, IconButton } from "ui";

interface MainChartTypeSelectProps {
  chart: any;
  style?: React.CSSProperties;
}

export const MainChartTypeSelect = (props: MainChartTypeSelectProps) => {
  return (
        <SelectButton
          options={{
            OHLC: {
              id: 'OHLC',
              text: <TextButton>Candles</TextButton>,
              icon: <IconButton><ChartCandles /></IconButton>
            },
            Bars: {
              id: 'Bars',
              text: <TextButton>Bars</TextButton>,
              icon: <IconButton><ChartBars/ ></IconButton>
            },
            Line: {
              id: 'Line',
              text: <TextButton>Line</TextButton>,
              icon: <IconButton><ChartLine /></IconButton>
            },
            Histogram: {
              id: 'Histogram',
              text: <TextButton>Histogram</TextButton>,
              icon: <IconButton><ChartHistogram /></IconButton>
            },
            ['Line and Histogram']: {
              id: 'Line and Histogram',
              text: <TextButton>Line and histogram</TextButton>,
              icon: <IconButton><ChartHistogramLine /></IconButton>
            }
          }}
          onSelect={(option) => {
            props.chart.setMainDrawMode(option);
          }}
          selectedOption='OHLC'
        />
  );
};
