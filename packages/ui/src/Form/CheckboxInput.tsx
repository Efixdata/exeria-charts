import * as React from "react";
import styled from "styled-components";
import { Check } from "@phosphor-icons/react";
import { checkboxBorderRadius } from "ui/theme";
import { inputFocusVisibleStyles } from "ui/inputStyles";

interface CheckboxInputProps {
  style?: React.CSSProperties | undefined;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  value?: boolean | undefined;
}

const Root = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--ui-input-height, 36px);
  height: var(--ui-input-height, 36px);
  cursor: pointer;
`;

const Input = styled.input`
  position: relative;
  width: 20px;
  height: 20px;
  margin: 0;
  padding: 0;
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  border-radius: ${checkboxBorderRadius};
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  &:checked {
    background-color: ${(props) => props.theme.accentColor};
    border-color: ${(props) => props.theme.accentColor};
  }

  ${inputFocusVisibleStyles}
`;

const CheckIcon = styled(Check)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  color: ${(props) => props.theme.dialog?.titleColor || "#ffffff"};
`;

export const CheckboxInput = (props: CheckboxInputProps) => {
  const checked = props.value === true;

  return (
    <Root style={props.style}>
      <Input type="checkbox" onChange={props.onChange} checked={checked} aria-checked={checked} />
      {checked ? <CheckIcon size={14} weight="bold" /> : null}
    </Root>
  );
};
