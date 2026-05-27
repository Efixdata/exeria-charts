import type { CSSProperties } from "react";

export const dialogFitLayoutStyle: CSSProperties = {
  height: "auto",
  maxHeight: "min(85vh, 720px)",
  display: "flex",
  flexDirection: "column",
};

export const dialogFitBodyStyle: CSSProperties = {
  flex: "0 1 auto",
  minHeight: 0,
};
