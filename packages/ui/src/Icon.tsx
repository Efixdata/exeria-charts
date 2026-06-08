import * as React from "react";
import styled from "styled-components";
import { iconButton } from "../theme";

const IconContainer = styled.span<{ themeContext: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  width: var(--ui-toolbar-icon, ${iconButton.iconSize}px);
  height: var(--ui-toolbar-icon, ${iconButton.iconSize}px);
  color: ${(props) => {
    const parent =
      props.themeContext === "buttons"
        ? props.theme.buttons
        : props.theme[props.themeContext].buttons;
    return parent["color"];
  }};

  path,
  circle {
    fill: currentColor;
  }

  path[fill="none"],
  circle[fill="none"] {
    fill: none;
    stroke: currentColor;
  }

  &.active {
    color: ${(props) => {
      const parent =
        props.themeContext === "buttons"
          ? props.theme.buttons
          : props.theme[props.themeContext].buttons;
      return parent["activeColor"];
    }};
  }

  picture {
    display: contents;
  }

  img,
  svg {
    width: var(--ui-toolbar-icon, ${iconButton.iconSize}px);
    height: var(--ui-toolbar-icon, ${iconButton.iconSize}px);
    margin: 0 auto;
  }
`;

interface IconProps {
  children?: React.ReactNode;
  image?: string | undefined;
  imageAlt?: string | undefined;
  imageType?: string | undefined;
  style?: React.CSSProperties | undefined;
  iconStyle?: React.CSSProperties | undefined;
  active?: boolean | undefined;
  id?: string | undefined;
  themeContext?: string | undefined;
}

export const Icon = (props: IconProps) => {
  const renderImage = () => {
    if (props.image)
      return (
        <picture>
          <source srcSet={props.image} type={props.imageType} />
          <img src={props.image} alt={props.imageAlt} style={props.iconStyle} />
        </picture>
      );
  };

  return (
    <IconContainer
      className={props.active ? "active" : ""}
      style={props.style}
      themeContext={props.themeContext || "buttons"}
    >
      {renderImage()}
      {props.children}
    </IconContainer>
  );
};
