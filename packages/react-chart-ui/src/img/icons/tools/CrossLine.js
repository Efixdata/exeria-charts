import * as React from "react";

const SvgCrossLine = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} xmlSpace="preserve" role="img" {...props}>
    <circle fill="#7F9DCC" cx={9} cy={9} r={2} />
    <path fill="#7F9DCC" d="M8.3 2.5h1.5v13H8.3z" />
    <path fill="#7F9DCC" d="M2.5 8.3h13v1.5h-13z" />
  </svg>
);

export default SvgCrossLine;
