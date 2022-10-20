import * as React from "react";
const SvgCandleChart = (props) => (
  <svg
    id="candle_chart_svg__Warstwa_1"
    xmlns="http://www.w3.org/2000/svg"
    x={0}
    y={0}
    viewBox="0 0 29 29"
    style={{
      enableBackground: "new 0 0 29 29",
    }}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <style>
      {
        ".candle_chart_svg__st0{fill:#fff}.candle_chart_svg__st1{fill:none;stroke:#fff;stroke-miterlimit:10}"
      }
    </style>
    <g id="candle_chart_svg__candle_chart">
      <path
        className="candle_chart_svg__st0"
        d="M11 13v3h-1v-3h1m1-1H9v5h3v-5z"
      />
      <path className="candle_chart_svg__st1" d="M10.5 17v3M10.5 10v2" />
      <path className="candle_chart_svg__st0" d="M13 10h3v6h-3z" />
      <path className="candle_chart_svg__st1" d="M14.5 7v11" />
      <path
        className="candle_chart_svg__st0"
        d="M19 14v3h-1v-3h1m1-1h-3v5h3v-5z"
      />
      <path className="candle_chart_svg__st1" d="M18.5 18v2M18.5 11v2" />
    </g>
  </svg>
);
export default SvgCandleChart;
