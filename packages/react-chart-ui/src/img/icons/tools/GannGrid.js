import * as React from "react";
const SvgGannGrid = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} xmlSpace="preserve" role="img" {...props}>
    <rect x={3} y={3} width={12} height={12} fill="none" stroke="#7F9DCC" strokeWidth={1.1} />
    <g stroke="#7F9DCC" strokeWidth={0.9}>
      <path d="M3 6h12M3 9h12M3 12h12M6 3v12M9 3v12M12 3v12" />
    </g>
  </svg>
);
export default SvgGannGrid;
