import * as React from "react";
const SvgLineHorizontal = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18" viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <circle fill="#7F9DCC" cx={3} cy={9} r={2} />
    <circle fill="#7F9DCC" cx={15} cy={9} r={2} />
    <path fill="#7F9DCC" d="M3.9 8.3h10.2v1.5H3.9z" />
  </svg>
);
export default SvgLineHorizontal;
