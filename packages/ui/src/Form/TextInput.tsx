import * as React from "react";
import styled from "styled-components";
import { inputBorderRadius, inputErrorBorder } from "ui/theme";
import { inputFocusVisibleStyles } from "ui/inputStyles";

interface TextInputProps {
  children?: JSX.Element | JSX.Element[];
  style?: React.CSSProperties | undefined;
  autoFocus?: boolean | undefined;
  placeholder?: string | undefined;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  type?: string | undefined;
  max?: number | undefined;
  min?: number | undefined;
  step?: number | undefined;
  value?: string | number | readonly string[] | undefined;
  allowEmpty?: boolean | undefined;
  id?: string;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

const Input = styled.input`
  color: ${(props) => props.theme.inputs.textColor};
  font-size: var(--ui-font-body, 13px);
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  height: var(--ui-input-height, 36px);
  border-radius: ${inputBorderRadius};
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  outline: none;
  padding: var(--ui-space-1, 4px) var(--ui-space-3, 12px);
  margin: 0;
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: ${(props) => props.theme.inputs.placeholderColor};
  }

  ${inputFocusVisibleStyles}
`;

export const TextInput = (props: TextInputProps) => {
  const style = props.style || {};
  const isInvalid =
    props["aria-invalid"] === true ||
    (props.allowEmpty === false &&
      (props.value === null || props.value === undefined || props.value === ""));

  if (isInvalid && props["aria-invalid"] !== false) {
    style.border = inputErrorBorder;
  }

  return (
    <Input
      id={props.id}
      name={props.name}
      style={style}
      type={props.type || "text"}
      autoFocus={!!props.autoFocus}
      placeholder={props.placeholder || ""}
      onChange={props.onChange}
      step={props.step}
      min={props.min}
      max={props.max}
      value={props.value}
      disabled={props.disabled}
      readOnly={props.readOnly}
      aria-label={props["aria-label"]}
      aria-labelledby={props["aria-labelledby"]}
      aria-describedby={props["aria-describedby"]}
      aria-invalid={isInvalid || undefined}
    >
      {props.children}
    </Input>
  );
};
