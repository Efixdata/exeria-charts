import * as React from "react";
import styled from "styled-components";
import { Icon } from "./Icon";

const Button = styled.button<{ themeContext: string }>`
  display: contents;
  & > div:hover,
  & > div:focus {
    background-color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["hoverBackground"];
    }};
    cursor: pointer;
  }
  & > div.active {
    background-color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["activeBackground"];
    }};
    color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["activeColor"];
    }};
    border-radius: 4px !important;
  }
`;

interface IconButtonProps {
  children?: React.ReactNode;
  image?: string | undefined;
  imageAlt?: string | undefined;
  imageType?: string | undefined;
  callback?: (() => void) | undefined;
  style?: React.CSSProperties | undefined;
  iconStyle?: React.CSSProperties | undefined;
  onClick?: (() => void) | undefined;
  active?: boolean | undefined;
  id?: string | undefined;
  themeContext?: string | undefined;
}

export const IconButton = (props: IconButtonProps) => {
  return (
    <Button onClick={props.onClick} themeContext={props.themeContext || "buttons"}>
      <Icon {...props}>{props.children}</Icon>
    </Button>
  );
};
