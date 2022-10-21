import * as React from "react";
const SvgEraser = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    role="img"
    {...props}
  >
    <path
      d="m6.9 7.3 4.2 4.1m4.3 3.8H5.2l-2.6-2.6c-.4-.4-.4-1.1 0-1.6h0l7.9-7.9c.4-.4 1.1-.4 1.6 0h0l3.2 3.2c.4.4.4 1.2 0 1.6L8 15.2"
      fill="transparent"
      stroke="#7F9DCC"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
export default SvgEraser;
