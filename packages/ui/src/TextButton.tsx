import * as React from "react";
import styled from "styled-components";
import { textButton, UI_FONT_FAMILY } from "../theme";
import { inputFocusVisibleStyles } from "../inputStyles";
import { Tooltip, type TooltipPlacement } from "./Tooltip";

const Button = styled.button<{ themeContext: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ui-space-2, 8px);
  box-sizing: border-box;
  background-color: transparent;
  border: 1px solid transparent;
  outline: none;
  margin: 0;
  padding: 0 var(--ui-space-3, 12px);
  color: ${(props) => {
    const parent =
      props.themeContext === "buttons"
        ? props.theme.buttons
        : props.theme[props.themeContext].buttons;
    return parent["color"];
  }};
  min-width: var(--ui-toolbar-touch, 40px);
  min-height: var(--ui-toolbar-touch, 40px);
  border-radius: ${textButton.borderRadius}px;
  white-space: nowrap;
  font-size: var(--ui-font-body, ${textButton.fontSize}px);
  font-weight: ${textButton.fontWeight};
  font-family: ${UI_FONT_FAMILY};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["hoverBackground"];
    }};
  }

  &.active {
    color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["activeColor"];
    }};
    background-color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["activeBackground"];
    }};
  }

  ${inputFocusVisibleStyles}
`;

interface TextButtonProps {
  children?: JSX.Element | JSX.Element[] | string;
  style?: React.CSSProperties | undefined;
  onClick?: (() => void) | undefined;
  callback?: (() => void) | undefined;
  active?: boolean | undefined;
  id?: string | undefined;
  themeContext?: string | undefined;
  title?: string | undefined;
  ariaLabel?: string | undefined;
  tooltipPlacement?: TooltipPlacement | undefined;
  tabIndex?: number;
}

export const TextButton = (props: TextButtonProps) => {
  const label = props.ariaLabel ?? props.title;

  const button = (
    <Button
      type="button"
      id={props.id}
      onClick={props.onClick ?? props.callback}
      className={props.active ? "active" : ""}
      style={props.style}
      themeContext={props.themeContext || "buttons"}
      aria-label={label}
      aria-pressed={props.active ? true : undefined}
      tabIndex={props.tabIndex}
    >
      {props.children}
    </Button>
  );

  if (!props.title) {
    return button;
  }

  return (
    <Tooltip label={props.title} placement={props.tooltipPlacement ?? "bottom"}>
      {button}
    </Tooltip>
  );
};
