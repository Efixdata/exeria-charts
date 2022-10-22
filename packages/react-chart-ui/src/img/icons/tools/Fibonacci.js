import * as React from "react";
const SvgFibonacci = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      opacity={0.5}
      fill="#7F9DCC"
      d="M15.5 15h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5zM15.5 10h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5zM15.5 13h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5z"
    />
    <path
      fill="#7F9DCC"
      d="M15.5 4h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5z"
    />
  </svg>
);
export default SvgFibonacci;
