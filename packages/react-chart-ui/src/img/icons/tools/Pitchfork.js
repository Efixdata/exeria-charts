import * as React from "react";
const SvgPitchfork = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <g fill="none" stroke="#7F9DCC" strokeWidth={1.1} strokeLinecap="round">
      <path d="M3.5 14.5 14.5 4.5" />
      <path d="M3.5 9 14.5 9" />
      <path d="M3.5 3.5 14.5 13.5" />
    </g>
    <circle cx={3.5} cy={9} r={1.2} fill="#7F9DCC" />
  </svg>
);
export default SvgPitchfork;
