import * as React from "react";
const SvgStroke = (props) => (
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
        strokeMiterlimit: 10,
        strokeDasharray: 1,
      }}
      d="M8 18.5h13"
    />
    <path
      style={{
        fill: "none",
        stroke: "#fff",
        strokeMiterlimit: 10,
        strokeDasharray: "2,1",
      }}
      d="M8 15.5h13"
    />
    <path
      style={{
        fill: "none",
        stroke: "#fff",
        strokeMiterlimit: 10,
        strokeDasharray: "3,2",
      }}
      d="M8 12.5h13"
    />
    <path
      style={{
        fill: "none",
        stroke: "#fff",
        strokeMiterlimit: 10,
      }}
      d="M8 9.5h13"
    />
  </svg>
);
export default SvgStroke;
