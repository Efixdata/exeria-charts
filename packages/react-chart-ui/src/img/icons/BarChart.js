import * as React from "react";
const SvgBarChart = (props) => (
  <svg
    id="bar_chart_svg__Warstwa_1"
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
        ".bar_chart_svg__st0{display:none}.bar_chart_svg__st2{fill:none;stroke:#fff;stroke-miterlimit:10}.bar_chart_svg__st3{fill:#fff}"
      }
    </style>
    <path
      d="M33.3 6.5h18v18h-18v-18z"
      style={{
        fill: "none",
      }}
    />
    <path className="bar_chart_svg__st2" d="M10.5 10v10M14.5 7v11M18.5 11v9" />
    <path
      className="bar_chart_svg__st3"
      d="M10 11h2.4v1H10zM12.6 11H15v1h-2.4zM8.4 16H11v1H8.4zM14 15h2.4v1H14zM16.6 15H19v1h-2.4zM18 12h2.6v1H18z"
    />
  </svg>
);
export default SvgBarChart;
