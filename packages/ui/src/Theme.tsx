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
        openBackground: string;
        hoverBackground: string;
        openColor: string;
        hoverColor: string;
        arrowHoverBackground: string;
        arrowColor: string;
        arrowOpenColor: string;
    }
    dialog: {
        backgroundColor: string;
        titleColor: string;
        textColor: string;
        dividerColor: string;
        itemTitleColor: string;
        itemSubTitleColor: string;
        itemHoverBackgroundColor: string;
    },
    inputs: {
        backgroundColor: string;
        placeholderColor: string;
        textColor: string;
    },
    scrollBar: {
        trackColor: string;
        thumbColor: string;
        thumbHoverColor: string;
    }
}

interface ThemeProps {
    children: any;
    theme?: ThemeInterface;
}

const defaultTheme: ThemeInterface = {
    background: "#100c22",
    border: {
        inner: "1px solid rgba(255, 255, 255, 0.1)"
    },
    accentColor: "#14f7ab",
    icons: {
        color: "#7F9DCC",
        activeColor: "#14f7ab",
        groupBackgroundColor: "rgba(255, 255, 255, 0.1)",
        hoverBackground: "rgba(255, 255, 255, 0.1)",
    },
    menu: {
        hoverBackgroundColor: "#555",
        splitButtonBackgroundColor: "#20213c0",
        activeBackgroundColor: "#323b53",
        activeBackgroundHoverColor: "#666",
        textColor: "#7f9dcc",
        textActiveColor: "#14f7ab"
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
