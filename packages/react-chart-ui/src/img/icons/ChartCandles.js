import * as React from "react";
const SvgChartCandles = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18" height="18" viewBox="0 0 18 18"
    xmlSpace="preserve"
    role="img"
    {...props}
  >
    <path
      fill="#7F9DCC"
      d="M5 8v3H4V8h1m1-1H3v5h3V7zM4 12h1v3H4zM4 5h1v2H4zM7 5h3v6H7z"
    />
    <path
      fill="#7F9DCC"
      d="M8 2h1v11H8zM13 9v3h-1V9h1m1-1h-3v5h3V8zM12 13h1v2h-1zM12 6h1v2h-1z"
    />
  </svg>
);
export default SvgChartCandles;
