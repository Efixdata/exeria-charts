import * as React from "react";
import styled from "styled-components";
import { textButton } from "../theme"; 

const Button = styled.button`
  box-sizing: border-box;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: ${textButton.buttonPadding}px ${textButton.buttonPadding * 2}px;
  color: ${textButton.textColor};
  min-width: ${textButton.buttonSize}px;
  min-height: ${textButton.buttonSize}px;
  border-radius: ${textButton.borderRadius}px;
  white-space: nowrap;
  font-size: ${textButton.fontSize}px;
  font-weight: ${textButton.fontWeight};
  font-family: Mulish,Roboto,sans-serif;

  &:hover {
    cursor: pointer;
    background-color: ${textButton.backgroundActiveColor};
  }

  &.active {
    color: ${textButton.textActiveColor};
  }
`

interface TextButtonProps {
  children?: JSX.Element|JSX.Element[]|string
  style?: React.CSSProperties
  onClick?: () => void
  callback?: () => void
  active?: boolean
  id?: string
}

export const TextButton = (props: TextButtonProps) => {
  return <Button onClick={props.onClick} className={props.active ? "active" : ""} style={props.style}>
    {props.children}
    </Button>;
};
