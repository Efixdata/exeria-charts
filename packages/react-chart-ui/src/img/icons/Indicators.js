import * as React from "react";
const SvgIndicators = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path fill="#7F9DCC" d="m3.8 9.9 3.6-3.6 2.4 2.4L15 2.9l-.8-.9-4.3 4.8-2.4-2.4L2.9 9l.9.9z" />
    <path fill="#7F9DCC" d="m3.8 15 3.6-3.6 2.4 2.4L15.1 8l-.9-.9L9.9 12 7.5 9.5l-4.6 4.6.9.9z" />
  </svg>
);
export default SvgIndicators;
