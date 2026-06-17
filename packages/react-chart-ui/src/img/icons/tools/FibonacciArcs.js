import * as React from "react";

const SvgFibonacciArcs = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <path fill="currentColor" d="M3 14.5h12v1H3z" opacity={0.35} />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      d="M3 14.5a6 6 0 0 1 12 0"
      opacity={0.45}
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      d="M4.5 14.5a4.5 4.5 0 0 1 9 0"
      opacity={0.65}
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      d="M6 14.5a3 3 0 0 1 6 0"
      opacity={0.85}
    />
    <circle cx={3} cy={14.5} r={1} fill="currentColor" />
    <circle cx={15} cy={14.5} r={1} fill="currentColor" />
  </svg>
);

export default SvgFibonacciArcs;
