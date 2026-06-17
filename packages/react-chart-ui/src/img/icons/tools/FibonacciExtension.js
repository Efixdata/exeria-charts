import * as React from "react";

const SvgFibonacciExtension = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 13.5 7.5 8.5 10.5 10.5 14.5 6.5"
      opacity={0.55}
    />
    <path fill="currentColor" d="M11.5 8h3M11.5 10h2.5M11.5 12h2" opacity={0.85} />
    <path fill="currentColor" d="M3 11.5h4.5M3 9.5h4" opacity={0.35} />
    <circle cx={3} cy={13.5} r={1} fill="currentColor" />
    <circle cx={7.5} cy={8.5} r={1} fill="currentColor" />
    <circle cx={10.5} cy={10.5} r={1} fill="currentColor" />
    <circle cx={14.5} cy={6.5} r={1} fill="currentColor" opacity={0.85} />
  </svg>
);

export default SvgFibonacciExtension;
