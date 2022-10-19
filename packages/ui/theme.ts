const white = '#ffffff';
const violet_ll = '#7f9dcc';
const violet_l = '#323b53';
const violet = '#201e3e';
const violet_d = '#120f29';
const violet_dd = '#080821';
const violet_background = '#1D1D3A'; // violet_ll * 10% on violet_d
const green = '#14f7ab';

const iconSize = 20;
const buttonSize = 26;
const buttonPadding = (buttonSize - iconSize) / 2;
const borderRadius = 4;

export const radioButton = {
    padding: 0,
    backgroundColor: violet_ll + '1A',
    borderRadius
}

export const iconButton = {
    iconSize,
    buttonSize,
    backgroundActiveColor: violet_ll + '1A',
    iconActiveColor: green,
    borderRadius
}

export const textButton = {
    buttonSize,
    buttonPadding,
    textColor: violet_ll,
    textActiveColor: green,
    backgroundActiveColor: violet_ll + '1A',
    borderRadius
}

export const splitButton = {
    backgroundColor: violet_background,
    borderRadius,
    spacerColor: violet_ll + '1A',
    activeBackgroundColor: violet_l,
    buttonSize,
}

export const splitButtonOption = {
    basePadding: buttonPadding,
    activeBackgroundColor: violet_ll + '1A',
}