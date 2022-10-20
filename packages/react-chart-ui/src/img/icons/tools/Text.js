import * as React from "react";
const SvgText = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18" viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <g fill="#7F9DCC">
      <path d="M7.5 4.2h3v9.1h-3zM4.5 13.3h9v2h-9z" />
      <path d="M3.5 2.3h11v2h-11z" />
      <path d="M2.5 2.3h2v4h-2zM13.5 2.3h2v4h-2z" />
    </g>
  </svg>
);
export default SvgText;
