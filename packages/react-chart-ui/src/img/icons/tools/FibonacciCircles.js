import * as React from "react";

const SvgFibonacciCircles = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <circle cx={9} cy={9.5} r={6.5} fill="none" stroke="currentColor" strokeWidth={1.1} opacity={0.45} />
    <circle cx={9} cy={9.5} r={4.5} fill="none" stroke="currentColor" strokeWidth={1.1} opacity={0.65} />
    <circle cx={9} cy={9.5} r={2.5} fill="none" stroke="currentColor" strokeWidth={1.1} opacity={0.85} />
    <circle cx={9} cy={9.5} r={1} fill="currentColor" />
  </svg>
);

export default SvgFibonacciCircles;
