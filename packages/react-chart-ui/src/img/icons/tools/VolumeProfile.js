import * as React from "react";

const SvgVolumeProfile = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} role="img" {...props}>
    <rect x="2" y="3" width="14" height="12" fill="none" stroke="#7F9DCC" strokeWidth="1.2" />
    <rect x="3.5" y="10" width="2.5" height="3.5" fill="#7F9DCC" opacity="0.55" />
    <rect x="6.5" y="8.5" width="2.5" height="5" fill="#7F9DCC" opacity="0.55" />
    <rect x="9.5" y="6.5" width="2.5" height="7" fill="#7F9DCC" opacity="0.55" />
    <rect x="12.5" y="9" width="2.5" height="4.5" fill="#7F9DCC" opacity="0.55" />
    <line x1="2" y1="11.5" x2="16" y2="11.5" stroke="#7F9DCC" strokeWidth="0.8" strokeDasharray="2 2" />
  </svg>
);

export default SvgVolumeProfile;
