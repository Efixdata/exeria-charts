import * as React from "react";
import styled, { css } from "styled-components";
import { UI_RADIUS } from "../designTokens";
import { inputFocusVisibleStyles } from "../inputStyles";
import { toolbarIconSvgStyles } from "./toolbarIconStyles";
import { Icon } from "./Icon";
import { Tooltip, type TooltipPlacement } from "./Tooltip";

const Button = styled.button<{ themeContext: string; $active?: boolean; $suppressHover?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  width: var(--ui-toolbar-touch, 40px);
  height: var(--ui-toolbar-touch, 40px);
  min-width: var(--ui-toolbar-touch, 40px);
  min-height: var(--ui-toolbar-touch, 40px);
  padding: 0;
  margin: 0;
  border: 1px solid transparent;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border-radius: var(--ui-radius-md, ${UI_RADIUS.md});
  background: transparent;
  color: ${(props) => {
    const parent =
      props.themeContext === "buttons"
        ? props.theme.buttons
        : props.theme[props.themeContext].buttons;
    return props.$active ? parent.activeColor : parent.color;
  }};
  cursor: pointer;

  ${(props) =>
    !props.$suppressHover &&
    css`
      &:hover:not(.active) {
        background-color: ${() => {
          const parent =
            props.themeContext === "buttons"
              ? props.theme.buttons
              : props.theme[props.themeContext].buttons;
          return parent.hoverBackground;
        }};
      }
    `}

  &.active {
    background-color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent.activeBackground;
    }};
    color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent.activeColor;
    }};
  }

  ${inputFocusVisibleStyles}

  ${toolbarIconSvgStyles}
`;

interface IconButtonProps {
  children?: React.ReactNode;
  image?: string | undefined;
  imageAlt?: string | undefined;
  imageType?: string | undefined;
  callback?: (() => void) | undefined;
  style?: React.CSSProperties | undefined;
  iconStyle?: React.CSSProperties | undefined;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  onDoubleClick?: React.MouseEventHandler<HTMLButtonElement> | undefined;
  active?: boolean | undefined;
  id?: string | undefined;
  themeContext?: string | undefined;
  title?: string | undefined;
  ariaLabel?: string | undefined;
  ariaPressed?: boolean | undefined;
  ariaExpanded?: boolean | undefined;
  tooltipPlacement?: TooltipPlacement | undefined;
  tabIndex?: number;
  /** Toggle buttons without a submenu should not show hover highlight. */
  suppressHoverBackground?: boolean;
}

export const IconButton = (props: IconButtonProps) => {
  const label = props.ariaLabel ?? props.title;
  const isActive = props.active === true;

  const button = (
    <Button
      type="button"
      id={props.id}
      onClick={props.onClick ?? props.callback}
      onDoubleClick={props.onDoubleClick}
      style={props.style}
      themeContext={props.themeContext || "buttons"}
      $active={isActive}
      $suppressHover={props.suppressHoverBackground === true}
      className={isActive ? "active" : undefined}
      aria-label={label}
      aria-pressed={props.ariaPressed ?? (isActive ? true : undefined)}
      aria-expanded={props.ariaExpanded}
      tabIndex={props.tabIndex}
    >
      {props.image ? (
        <Icon {...props} active={isActive} themeContext={props.themeContext || "buttons"} />
      ) : (
        props.children
      )}
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
