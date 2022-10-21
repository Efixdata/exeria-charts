import * as React from "react";
import styled from "styled-components";
import { textButton } from "../theme"; 

const Button = styled.button`
  box-sizing: border-box;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: ${textButton.buttonPadding}px;
  color: ${textButton.textColor};
  min-width: ${textButton.buttonSize}px;
  min-height: ${textButton.buttonSize}px;
  border-radius: ${textButton.borderRadius}px;

  &:hover {
    cursor: pointer;
    background-color: ${textButton.backgroundActiveColor};
  }

  &.active {
    color: ${textButton.textActiveColor};
  }
`

interface IconTextButtonProps {
  children?: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
  callback?: () => void
  active?: boolean
}

export const IconTextButton = (props: IconTextButtonProps) => {
  return <Button onClick={props.onClick} className={props.active ? "active" : ""} style={props.style}>
    {props.children}
    </Button>;
};
