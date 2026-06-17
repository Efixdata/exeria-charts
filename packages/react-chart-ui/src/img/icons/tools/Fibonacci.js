import * as React from "react";
const SvgFibonacci = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={18}
    height={18}
    xmlSpace="preserve"
    role="img"
    viewBox="0 0 18 18"
    {...props}
  >
    <path
      opacity={0.5}
      fill="currentColor"
      d="M15.5 15h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5zM15.5 10h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5zM15.5 13h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5z"
    />
    <path fill="currentColor" d="M15.5 4h-13c-.3 0-.5-.2-.5-.5s.2-.5.5-.5h13c.3 0 .5.2.5.5s-.2.5-.5.5z" />
    <path fill="currentColor" d="M3 15.5 13 5.5" opacity={0.45} />
  </svg>
);
export default SvgFibonacci;
