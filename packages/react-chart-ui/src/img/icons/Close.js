import * as React from "react";
const SvgClose = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <g fill="#7F9DCC">
      <path d="m13 4 1 1-4 4 4 4-1 1-5.1-5z" />
      <path d="m5 14-1-1 4-4-4-4 1-1 5.1 5z" />
    </g>
  </svg>
);
export default SvgClose;
