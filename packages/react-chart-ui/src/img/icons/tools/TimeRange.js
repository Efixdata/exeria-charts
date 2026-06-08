import * as React from "react";

const SvgTimeRange = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 18 18" role="img" {...props}>
    <path
      fill="#7F9DCC"
      opacity="0.35"
      d="M3 3.5h12v8.5H3z"
    />
    <path fill="#7F9DCC" d="M3 12.5h12V14H3z" />
    <path fill="#7F9DCC" d="M5.5 2.5v11M12.5 2.5v11" />
  </svg>
);

export default SvgTimeRange;
