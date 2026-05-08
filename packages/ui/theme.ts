const white = "#ffffff";
const violet_ll = "#7f9dcc";
const violet_l = "#323b53";
const violet = "#201e3e"; // secondary color
const violet_d = "#120f29";
const violet_dd = "#080821";
const violet_background = "#1D1D3A"; // violet_ll * 10% on violet_d
const green = "#14f7ab"; // primary color
const red = "#e53c42";

const iconSize = 18;
const fontSize = 13;
const buttonSize = 26;
const buttonPadding = (buttonSize - iconSize) / 2;
const borderRadius = 4;
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
  iconActiveColor: green,
  borderRadius,
};

export const textButton = {
  buttonSize,
  buttonPadding,
  textColor: violet_ll,
  textActiveColor: green,
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
  menuPadding: buttonPadding,
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
  fillActiveColor: green,
  iconSize,
};

// INPUTS

export const labelColor = violet_ll;
export const inputBackgroundColor = violet_dd;
export const inputBorderRadius = "30px";
export const checkboxBorderRadius = "6px";
export const checkboxTickColor = violet_ll;
export const inputErrorBorder = `1px solid ${red}`;
