import * as React from "react";
const SvgRectangle = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <g fill="#7F9DCC">
      <path d="m1.265 13.564.732-.523.581.814-.733.523zM4.1 12.9l-.6-.8 1.7-1.2.6.8-1.7 1.2zm3.4-2.3L7 9.8l1.7-1.2.6.8-1.8 1.2zM11 8.3l-.6-.8 1.7-1.2.6.8L11 8.3zM14.4 6l-.6-.8.9-.6.6.8-.9.6zM15.511 4.089l.695-.397.496.867-.694.398z" />
    </g>
    <path
      fill="#7F9DCC"
      d="M15.5 4.5v9h-13v-9h13M16 3H2c-.6 0-1 .4-1 1v10c0 .6.4 1 1 1h14c.6 0 1-.4 1-1V4c0-.6-.4-1-1-1z"
    />
  </svg>
);
export default SvgRectangle;
