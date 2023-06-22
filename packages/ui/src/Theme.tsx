import React from "react";
import { ThemeProvider } from "styled-components";

interface buttonProps {
    color?: string,
    activeColor?: string,
    hoverColor?: string,
    hoverBackground?: string
}

export interface ThemeInterface {
    border?: {
        inner?: string;
        outter?: string;
        radius?: number;
    }
    gap?: number;
    accentColor?: string;
    buttons?: buttonProps;
    radioButton?: {
        buttons?: buttonProps;
        background?: string;
    }
    toolbar?: {
        buttons?: buttonProps;
        background?: string;
    }
    subMenu: {
        buttons?: buttonProps;
        background?: string;
    },
    splitButton: {
        openBackground?: string;
        hoverBackground?: string;
        openColor?: string;
        hoverColor?: string;
        arrowHoverBackground?: string;
        arrowColor?: string;
        arrowOpenColor?: string;
    }
    dialog: {
        backgroundColor?: string;
        titleColor?: string;
        textColor?: string;
        dividerColor?: string;
        itemTitleColor?: string;
        itemSubTitleColor?: string;
        itemHoverBackgroundColor?: string;
    },
    inputs: {
        backgroundColor?: string;
        placeholderColor?: string;
        textColor?: string;
    },
    scrollBar: {
        trackColor?: string;
        thumbColor?: string;
        thumbHoverColor?: string;
    }
}

interface ThemeProps {
    children: any;
    theme?: ThemeInterface;
}

const violetDark = '#100c22';
const violet = '#323b53';
const violetLight = "#7F9DCC";
const green = "#14f7ab";
const transparentWhite = "rgba(255, 255, 255, 0.1)";
const buttonsTheme =  {
    color: violetLight,
    activeColor: green,
    hoverColor: violetLight,
    hoverBackground: transparentWhite,
}

const defaultTheme: ThemeInterface = {
    border: {
        inner: "1px solid rgba(255, 255, 255, 0.1)"
    },
    accentColor: green,
    buttons: buttonsTheme,
    radioButton: {
        buttons: buttonsTheme,
        background: violetLight + '26'
    },
    toolbar: {
        buttons: buttonsTheme,
        background: violetDark
    },
    subMenu: {
        buttons: buttonsTheme,
        background: violet,
    },
    splitButton: {
        openBackground: violet,
        hoverBackground: violet,
        openColor: violetLight,
        hoverColor: violetLight,
        arrowHoverBackground: transparentWhite,
        arrowColor: violetLight,
        arrowOpenColor: violetLight
    },
    dialog: {
        backgroundColor: "red",
        titleColor: "white",
        textColor: "white",
        dividerColor: "rgba(255, 255, 255, 0.1)",
        itemTitleColor: "white",
        itemSubTitleColor: "rgba(255, 255, 255, 0.7)",
        itemHoverBackgroundColor: "rgba(255, 255, 255, 0.1)"
    },
    inputs: {
        backgroundColor: "#0F0C22",
        placeholderColor: "#c3c2cc80",
        textColor: "white",
    },
    scrollBar: {
        trackColor: "rgba(255, 255, 0.02)",
        thumbColor: "rgba(255, 255, 0.1)",
        thumbHoverColor: "#7F9DCC",
    }
}

export const Theme = (props: ThemeProps) => {
    return <ThemeProvider theme={props.theme || defaultTheme}>{props.children}</ThemeProvider>
}
