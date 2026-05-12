import * as React from "react";
import styled from "styled-components";
import { inputErrorBorder } from "ui/theme";

interface TextInputProps {
  children?: JSX.Element | JSX.Element[];
  style?: React.CSSProperties | undefined;
  autoFocus?: boolean | undefined;
  placeholder?: string | undefined;
  onChange?: any;
  type?: string | undefined;
  max?: number | undefined;
  min?: number | undefined;
  step?: number | undefined;
  value?: string | number | readonly string[] | undefined;
  allowEmpty?: boolean | undefined;
}

const Input = styled.input`
  color: ${(props) => props.theme.inputs.textColor};
  font-size: 13px;
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  height: 30px;
  border-radius: 30px;
  border: none;
  outline: none;
  padding: 4px 16px;
  margin-left: -8px;
  margin-right: -8px;
  width: calc(100% - 16px);
  box-sizing: initial;

  &::placeholder {
    color: ${(props) => props.theme.inputs.placeholderColor};
  }
`;

export const TextInput = (props: TextInputProps) => {
  const style = props.style || {};

  if (
    props.allowEmpty === false &&
    (props.value === null || props.value === undefined || props.value === "")
  ) {
    style.border = inputErrorBorder;
  }

  return (
    <Input
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
    </Input>
  );
};
