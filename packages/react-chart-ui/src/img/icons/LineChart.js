import * as React from "react";
const SvgLineChart = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 29 29"
    style={{
      enableBackground: "new 0 0 29 29",
    }}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      style={{
        fill: "none",
        stroke: "#fff",
        strokeWidth: 1.25,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeMiterlimit: 10,
      }}
      d="m8.5 17.5 2-6 3 9 3-12 2 6 2-6"
    />
  </svg>
);
export default SvgLineChart;
