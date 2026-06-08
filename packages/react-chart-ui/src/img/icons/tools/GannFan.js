import * as React from "react";
const SvgGannFan = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} xmlSpace="preserve" role="img" {...props}>
    <g fill="none" stroke="#7F9DCC" strokeWidth={1.1} strokeLinecap="round">
      <path d="M3 15 15 3" />
      <path d="M3 12 15 8" />
      <path d="M3 9 15 9" />
      <path d="M3 6 15 10" />
      <path d="M3 3 15 15" />
    </g>
    <circle cx={3} cy={9} r={1.2} fill="#7F9DCC" />
  </svg>
);
export default SvgGannFan;
