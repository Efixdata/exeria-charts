import * as React from "react";
const SvgTwitter = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      fill={props.fill || "#7F9DCC"}
      d="m16.8 4.7-2.2 2.2C14.2 12 9.9 16 4.7 16c-1.1 0-1.9-.2-2.6-.5-.5-.3-.8-.6-.8-.6-.2-.3-.1-.6.2-.8 0 0 .1 0 .1-.1 0 0 1.7-.7 2.9-1.9-.7-.5-1.3-1.1-1.8-1.8-1-1.4-2.1-3.7-1.4-7.2 0-.2.2-.4.4-.5.2-.1.4 0 .6.1 0 0 2.5 2.4 5.4 3.2v-.4C7.6 3.6 9.2 2 11.2 2c1.2 0 2.4.7 3 1.7h2.2c.2 0 .5.1.5.4.1.2.1.5-.1.6z"
    />
  </svg>
);
export default SvgTwitter;
