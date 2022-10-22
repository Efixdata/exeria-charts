import * as React from "react";
const SvgCycles = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path fill="#7F9DCC" d="M3 2h1v15H3zM15 2h1v15h-1zM9 2h1v15H9z" />
    <circle fill="#7F9DCC" cx={3.5} cy={9} r={1.5} />
    <circle fill="#7F9DCC" cx={9.5} cy={9} r={1.5} />
    <circle fill="#7F9DCC" cx={15.5} cy={9} r={1.5} />
  </svg>
);
export default SvgCycles;
