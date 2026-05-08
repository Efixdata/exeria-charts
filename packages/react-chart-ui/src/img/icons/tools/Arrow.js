import * as React from "react";
const SvgArrow = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path fill="#7F9DCC" d="m4.724 7.655 5.586-5.587 5.657 5.656-5.585 5.587z" />
    <path fill="#7F9DCC" d="M3 4.7 13.3 15H3z" />
  </svg>
);
export default SvgArrow;
