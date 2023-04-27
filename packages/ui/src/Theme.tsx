import React from "react";
import { ThemeProvider } from "styled-components";

export interface ThemeObject {
    background: string;
    border: string;
    accentColor: string;
  }

interface ThemeProps {
    children: any;
    theme?: ThemeObject;
}

const defaultTheme: ThemeObject = {
    background: "blue",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    accentColor: "green"
}

export const Theme = (props: ThemeProps) => {
    return <ThemeProvider theme={props.theme || defaultTheme}>{props.children}</ThemeProvider>
}
