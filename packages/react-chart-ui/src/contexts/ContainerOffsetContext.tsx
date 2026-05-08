import React from "react";
const ContainerOffsetContext = React.createContext<{ offsetTop?: number; offsetBottom?: number }>(
  {}
);
export default ContainerOffsetContext;
