import * as React from "react";
import { useState } from "react";
import type { DrawMode } from "@efixdata/exeria-chart";
import {
  ChartHistogram,
  ChartLine,
  ChartBars,
  ChartCandles,
  ChartHistogramLine,
} from "../../img/icons/chartTypes/index.js";
import { SelectButton, TextButton, IconButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";

interface MainChartTypeSelectProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

export const MainChartTypeSelect = (props: MainChartTypeSelectProps) => {
  const defaultDrawMode: DrawMode = "OHLC";
  const [selectedDrawMode, setSelectedDrawMode] = useState<DrawMode>(defaultDrawMode);

  function getOptions() {
    const options = {
      OHLC: {
        id: "OHLC",
        text: <TextButton themeContext={getContext("OHLC")}>Candles</TextButton>,
        icon: (
          <IconButton themeContext={getContext("OHLC")}>
            <ChartCandles />
          </IconButton>
        ),
      },
      Bars: {
        id: "Bars",
        text: <TextButton themeContext={getContext("Bars")}>Bars</TextButton>,
        icon: (
          <IconButton themeContext={getContext("Bars")}>
            <ChartBars />
          </IconButton>
        ),
      },
      Line: {
        id: "Line",
        text: <TextButton themeContext={getContext("Line")}>Line</TextButton>,
        icon: (
          <IconButton themeContext={getContext("Line")}>
            <ChartLine />
          </IconButton>
        ),
      },
      Histogram: {
        id: "Histogram",
        text: <TextButton themeContext={getContext("Histogram")}>Histogram</TextButton>,
        icon: (
          <IconButton themeContext={getContext("Histogram")}>
            <ChartHistogram />
          </IconButton>
        ),
      },
      ["Line and Histogram"]: {
        id: "Line and Histogram",
        text: (
          <TextButton themeContext={getContext("Line and Histogram")}>
            Line and histogram
          </TextButton>
        ),
        icon: (
          <IconButton themeContext={getContext("Line and Histogram")}>
            <ChartHistogramLine />
          </IconButton>
        ),
      },
    };

    function getContext(id: string) {
      return selectedDrawMode === id ? "toolbar" : "subMenu";
    }

    return options;
  }

  return (
    <SelectButton
      options={getOptions()}
      onSelect={(option) => {
        if (!option) return;
        props.chart?.setMainDrawMode(option as DrawMode);
        setSelectedDrawMode(option as DrawMode);
      }}
      selectedOption={selectedDrawMode}
    />
  );
};
