import * as React from "react";
const SvgOval = (props) => (
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
      d="M9 15C4.3 15 .5 12.5.5 9.5S4.3 4 9 4s8.5 2.5 8.5 5.5S13.7 15 9 15zM9 5C4.9 5 1.5 7 1.5 9.5S4.9 14 9 14s7.5-2 7.5-4.5S13.1 5 9 5z"
    />
    <g fill="#7F9DCC">
      <path d="M.237 14.133 1 13.656l.53.848-.764.477zM3.3 13.4l-.5-.9 1.8-1 .4.9-1.7 1zm3.5-2.1-.5-.9 1.8-1 .5.9-1.8 1zm3.6-2.1-.5-.8 1.8-1 .5.9-1.8.9zM14 7.1l-.5-.9 1.8-1 .5.9-1.8 1zM16.437 4.634l.763-.477.53.848-.763.477z" />
    </g>
  </svg>
);
export default SvgOval;
