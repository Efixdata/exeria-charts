import * as React from "react";

const channelTop = (t) => ({ x: 3 + t * 12, y: 14 - t * 9 });
const channelBottom = (t) => ({ x: 3 + t * 12, y: 11 - t * 9 });

const SvgFibonacciChannel = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <path
      fill="currentColor"
      d="M3 14 15 5 15.8 5.8 3.8 14.8Z M3 11 15 2 15.8 2.8 3.8 11.8Z"
      opacity={0.12}
    />
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth={1.1}
      strokeLinecap="round"
      d="M3 14 15 5M3 11 15 2"
      opacity={0.55}
    />
    {[0.28, 0.52, 0.76].map((t) => {
      const top = channelTop(t);
      const bottom = channelBottom(t);
      return (
        <path
          key={t}
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          strokeLinecap="round"
          d={`M${top.x} ${top.y} ${bottom.x} ${bottom.y}`}
          opacity={0.85}
        />
      );
    })}
    <circle cx={3} cy={14} r={1} fill="currentColor" />
    <circle cx={15} cy={5} r={1} fill="currentColor" />
    <circle cx={3} cy={11} r={0.85} fill="currentColor" opacity={0.75} />
    <circle cx={15} cy={2} r={0.85} fill="currentColor" opacity={0.75} />
  </svg>
);

export default SvgFibonacciChannel;
