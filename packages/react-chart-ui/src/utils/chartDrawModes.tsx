import * as React from "react";
import type { DrawMode } from "@efixdata/exeria-chart";
import {
  ChartBars,
  ChartCandles,
  ChartHistogram,
  ChartHistogramLine,
  ChartLine,
} from "../img/icons/chartTypes/index.js";

export type ChartDrawModeOption = {
  id: DrawMode;
  labelKey: string;
  defaultLabel: string;
  renderIcon: () => React.ReactElement;
};

export const CHART_DRAW_MODE_OPTIONS: ChartDrawModeOption[] = [
  {
    id: "OHLC",
    labelKey: "chart_type_candles",
    defaultLabel: "Candles",
    renderIcon: () => <ChartCandles />,
  },
  {
    id: "Bars",
    labelKey: "chart_type_bars",
    defaultLabel: "Bars",
    renderIcon: () => <ChartBars />,
  },
  {
    id: "Line",
    labelKey: "chart_type_line",
    defaultLabel: "Line",
    renderIcon: () => <ChartLine />,
  },
  {
    id: "Histogram",
    labelKey: "chart_type_histogram",
    defaultLabel: "Histogram",
    renderIcon: () => <ChartHistogram />,
  },
  {
    id: "Line and Histogram",
    labelKey: "chart_type_line_histogram",
    defaultLabel: "Line and histogram",
    renderIcon: () => <ChartHistogramLine />,
  },
];
