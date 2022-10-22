import * as React from "react";
const SvgLineMulti = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <circle fill="#7F9DCC" cx={3} cy={13} r={2} />
    <circle fill="#7F9DCC" cx={15} cy={5} r={2} />
    <path
      fill="#7F9DCC"
      d="m4.1 13.2-1.1-1 4.7-5.1 2.8 2.3 3.7-4.8 1.2.9-4.7 6.1-2.9-2.4z"
    />
  </svg>
);
export default SvgLineMulti;
