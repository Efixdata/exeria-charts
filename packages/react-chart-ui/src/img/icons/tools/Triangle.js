import * as React from "react";
const SvgTriangle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      fill="#7F9DCC"
      d="M18.3 15.7H1L9.6.6l8.7 15.1zm-15.6-1h13.9l-7-12.1-6.9 12.1z"
    />
  </svg>
);
export default SvgTriangle;
