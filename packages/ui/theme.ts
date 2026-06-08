import { UI_RADIUS } from "./designTokens";

const white = "#ffffff";
const violet_ll = "#7f9dcc";
const violet_l = "#323b53";
const violet = "#201e3e"; // secondary color
const violet_d = "#120f29";
const violet_dd = "#080821";
const violet_background = "#1D1D3A"; // violet_ll * 10% on violet_d
const accent = "#2962FF";
const red = "#e53c42";

const iconSize = 20;
const fontSize = 13;
const buttonSize = 40;
const buttonPadding = (buttonSize - iconSize) / 2;
const borderRadius = Number.parseInt(UI_RADIUS.md, 10);
const backgroundTransparency15 = "26";

export const radioButton = {
  padding: 0,
  backgroundColor: violet_ll + backgroundTransparency15,
  borderRadius,
  gap: 2,
};

export const iconButton = {
  iconSize,
  buttonSize,
  backgroundActiveColor: violet_ll + backgroundTransparency15,
  iconActiveColor: accent,
  borderRadius,
};

export const textButton = {
  buttonSize,
  buttonPadding,
  textColor: violet_ll,
  textActiveColor: accent,
  backgroundActiveColor: violet_ll + backgroundTransparency15,
  borderRadius,
  fontSize,
  fontWeight: 500,
};

export const splitButton = {
  borderRadius,
  spacerColor: violet_ll + backgroundTransparency15,
  hoverBackground: violet_background,
  backgroundActiveColor: violet_l,
  buttonHoverColor: violet_ll + backgroundTransparency15,
  buttonSize,
  menuPadding: 4,
  menuOptionHeight: 32,
  menuIconSize: 16,
};

export const selectButton = {
  borderRadius,
  spacerColor: violet_ll + backgroundTransparency15,
  hoverBackground: violet_background,
  backgroundActiveColor: violet_l,
  buttonHoverColor: violet_ll + backgroundTransparency15,
  buttonSize,
};

export const buttonOption = {
  basePadding: buttonPadding,
  backgroundActiveColor: violet_ll + backgroundTransparency15,
  fillActiveColor: accent,
  iconSize,
};

// INPUTS

export const labelColor = violet_ll;
export const inputBackgroundColor = violet_dd;
export const inputBorderRadius = UI_RADIUS.lg;
export const checkboxBorderRadius = UI_RADIUS.md;
export const checkboxTickColor = violet_ll;
export const inputErrorBorder = `1px solid ${red}`;

export const UI_FONT_FAMILY =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
