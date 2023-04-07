import * as React from "react";
import styled from "styled-components";
import { inputBackgroundColor, inputBorderRadius, inputErrorBorder } from "ui/theme";

interface TextInputProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  autoFocus?: boolean;
  placeholder?: string;
  onChange?: any;
  type?: string;
  max?: number;
  min?: number;
  step?: number;
  value?: string;
  allowEmpty?: boolean;
}

const Input = styled.input`
    color: white;
    font-size: 13px;
    background-color: ${inputBackgroundColor};
    height: 38px;
    border-radius: ${inputBorderRadius};
    border: none;
    outline: none;
    padding: 4px 16px;
    margin-left: -8px;
    margin-right: -8px;
    width: calc(100% + 16px);
    box-sizing: border-box;
    &::placeholder {
        color: #c3c2cc80;
    }
`

export const TextInput = (props: TextInputProps) => {

  const style = props.style || {};

  if (props.allowEmpty === false && (props.value === null || props.value === undefined || props.value === "")) {
    style.border = inputErrorBorder;
  }

  return <Input
    style={style}
    type={props.type || "text"}
    autoFocus={!!props.autoFocus}
    placeholder={props.placeholder || ""}
    onChange={props.onChange}
    step={props.step}
    min={props.min}
    max={props.max}
    value={props.value}
  >
    {props.children}
  </Input>;
};
