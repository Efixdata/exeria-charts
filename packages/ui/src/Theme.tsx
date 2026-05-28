import React from "react";
import { ThemeProvider } from "styled-components";

interface buttonProps {
  color?: string;
  activeColor?: string;
  hoverColor?: string;
  hoverBackground?: string;
  activeBackground?: string;
}

export interface ThemeInterface {
  border?: {
    inner?: string;
    outter?: string;
    radius?: number;
  };
  gap?: number;
  accentColor?: string;
  buttons?: buttonProps;
  radioButton?: {
    buttons?: buttonProps;
    background?: string;
  };
  toolbar?: {
    buttons?: buttonProps;
    background?: string;
    showShareChartButton?: boolean;
    showChartScaleSwitch?: boolean;
    showCurrency?: boolean;
    topMenuPosition?: string;
  };
  subMenu: {
    buttons?: buttonProps;
    background?: string;
  };
  splitButton: {
    openBackground?: string;
    hoverBackground?: string;
    openColor?: string;
    hoverColor?: string;
    arrowHoverBackground?: string;
    arrowColor?: string;
    arrowOpenColor?: string;
  };
  dialog: {
    backgroundColor?: string;
    titleColor?: string;
    textColor?: string;
    dividerColor?: string;
    itemTitleColor?: string;
    itemSubTitleColor?: string;
    itemHoverBackgroundColor?: string;
  };
  inputs: {
    backgroundColor?: string; // should be solid to override native select drop-down color
    placeholderColor?: string;
    textColor?: string;
    labelColor?: string;
  };
  scrollBar: {
    trackColor?: string;
    thumbColor?: string;
    thumbHoverColor?: string;
  };
}

interface ThemeProps {
  children: any;
  theme?: ThemeInterface | undefined;
}

const text = "#D1D4DC";
const muted = "#787B86";
const inputSurface = "#2A2E39";
const chrome = "#1E222D";
const accent = "#9598A1";
const divider = "rgba(255, 255, 255, 0.12)";
const hoverBackground = "rgba(255, 255, 255, 0.08)";

const buttonColors = {
  color: muted,
  activeColor: "#FFFFFF",
  hoverColor: text,
  hoverBackground: "rgba(255, 255, 255, 0.12)",
  activeBackground: inputSurface,
};

const defaultTheme: ThemeInterface = {
  border: {
    inner: "1px solid #434651",
    radius: 8,
  },
  gap: 8,
  accentColor: accent,
  buttons: buttonColors,
  radioButton: {
    buttons: buttonColors,
    background: "rgba(255, 255, 255, 0.06)",
  },
  toolbar: {
    buttons: buttonColors,
    background: chrome,
    showChartScaleSwitch: true,
    showShareChartButton: false,
    showCurrency: false,
    topMenuPosition: "right",
  },
  subMenu: {
    buttons: buttonColors,
    background: chrome,
  },
  splitButton: {
    openBackground: chrome,
    hoverBackground: chrome,
    openColor: text,
    hoverColor: text,
    arrowHoverBackground: hoverBackground,
    arrowColor: muted,
    arrowOpenColor: text,
  },
  dialog: {
    backgroundColor: chrome,
    titleColor: text,
    textColor: text,
    dividerColor: divider,
    itemTitleColor: text,
    itemSubTitleColor: muted,
    itemHoverBackgroundColor: hoverBackground,
  },
  inputs: {
    backgroundColor: inputSurface,
    placeholderColor: muted,
    textColor: text,
    labelColor: text,
  },
  scrollBar: {
    trackColor: hoverBackground,
    thumbColor: "rgba(255, 255, 255, 0.22)",
    thumbHoverColor: "rgba(255, 255, 255, 0.34)",
  },
};

export const Theme = (props: ThemeProps) => {
  return <ThemeProvider theme={props.theme || defaultTheme}>{props.children}</ThemeProvider>;
};
