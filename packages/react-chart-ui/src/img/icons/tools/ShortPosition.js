import * as React from "react";

const SvgShortPosition = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <rect x="3" y="3" width="12" height="12" rx="1" fill="none" stroke="#7F9DCC" strokeWidth="1.2" />
    <rect x="3" y="3" width="12" height="4" fill="#F85149" opacity="0.55" />
    <rect x="3" y="10" width="12" height="5" fill="#3FB950" opacity="0.55" />
    <path d="M9 8.5V10.5M7.5 9.5h3" stroke="#7F9DCC" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export default SvgShortPosition;
