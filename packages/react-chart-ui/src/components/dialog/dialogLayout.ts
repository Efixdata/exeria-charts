import type { CSSProperties } from "react";
import { UI_SPACE } from "ui/designTokens";

export const DIALOG_BODY_PADDING = `${UI_SPACE[4]} ${UI_SPACE[5]}`;

export const dialogFitLayoutStyle: CSSProperties = {
  height: "auto",
  maxHeight: "min(85vh, 720px)",
  display: "flex",
  flexDirection: "column",
};

export const dialogFitBodyStyle: CSSProperties = {
  flex: "0 1 auto",
  minHeight: 0,
  padding: 0,
};

export const dialogCatalogLayoutStyle: CSSProperties = {
  ...dialogFitLayoutStyle,
  width: 600,
  maxWidth: "calc(100vw - 32px)",
  minHeight: 560,
};

export const dialogCatalogBodyStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  padding: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

export const dialogScrollBodyStyle: CSSProperties = {
  padding: 0,
  flex: "1 1 auto",
  minHeight: 0,
  maxHeight: "min(78vh, 760px)",
};

export const dialogPaddedBodyStyle: CSSProperties = {
  ...dialogFitBodyStyle,
  padding: DIALOG_BODY_PADDING,
};
