import * as React from "react";

const SvgFibonacciTimeZone = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <path fill="currentColor" d="M3 4.5v9h1v-9H3zm2 0v9h1v-9H5zm3 0v9h1v-9H8zm5 0v9h1v-9h-1z" opacity={0.85} />
    <path fill="currentColor" d="M3 4.5h12v1H3zM3 13.5h12v1H3z" opacity={0.45} />
    <path fill="currentColor" d="M5.5 6.5h.8v1h-.8zm2.2 1.2h.8v1h-.8zm3.5 2h.8v1h-.8z" opacity={0.65} />
  </svg>
);

export default SvgFibonacciTimeZone;
