import * as React from "react";
const SvgCross = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18" viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      fill="#7F9DCC"
      d="M1 8h7v1H1zM11 8h7v1h-7zM8.999 7.001v-7h1v7zM8.991 17.009v-7h1v7z"
    />
  </svg>
);
export default SvgCross;
