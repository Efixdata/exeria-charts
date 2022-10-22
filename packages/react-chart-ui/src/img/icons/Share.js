import * as React from "react";
const SvgShare = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <circle fill="#7F9DCC" cx={12} cy={4} r={2} />
    <circle fill="#7F9DCC" cx={12} cy={14} r={2} />
    <circle fill="#7F9DCC" cx={5} cy={9} r={2} />
    <path fill="#7F9DCC" d="m4.71 8.593 6.998-5 .581.814-6.997 5z" />
    <path fill="#7F9DCC" d="m4.71 9.408.58-.814 6.999 4.998-.581.814z" />
  </svg>
);
export default SvgShare;
