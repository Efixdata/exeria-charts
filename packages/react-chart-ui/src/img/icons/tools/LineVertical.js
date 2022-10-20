import * as React from "react";
const SvgLineVertical = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18" viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path fill="#7F9DCC" d="M8.3 4.1h1.5v9.8H8.3z" />
    <circle fill="#7F9DCC" cx={9} cy={15} r={2} />
    <circle fill="#7F9DCC" cx={9} cy={3} r={2} />
  </svg>
);
export default SvgLineVertical;
