import * as React from "react";
const SvgLineTrend = (props) => (
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
      d="M3.35 13.324 13.532 3.142l1.061 1.06L4.411 14.386z"
    />
    <circle fill="#7F9DCC" cx={3.6} cy={14.2} r={2} />
    <circle fill="#7F9DCC" cx={14.4} cy={3.4} r={2} />
  </svg>
);
export default SvgLineTrend;
