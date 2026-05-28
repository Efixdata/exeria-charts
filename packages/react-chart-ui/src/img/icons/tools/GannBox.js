import * as React from "react";
const SvgGannBox = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} xmlSpace="preserve" role="img" {...props}>
    <rect x={3} y={3} width={12} height={12} fill="none" stroke="#7F9DCC" strokeWidth={1.1} />
    <g fill="none" stroke="#7F9DCC" strokeWidth={0.9} strokeLinecap="round">
      <path d="M3 6h12M3 9h12M3 12h12M6 3v12M9 3v12M12 3v12" />
      <path d="M3 15 15 3" />
      <path d="M3 12 12 9" />
      <path d="M3 9 9 6" />
    </g>
  </svg>
);
export default SvgGannBox;
