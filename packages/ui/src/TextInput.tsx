import * as React from "react";
import styled from "styled-components";

interface TextInputProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  autoFocus?: boolean;
  placeholder?: string;
  onChange?: any;

}

const Input = styled.input`
    color: ${props => props.theme.inputs.textColor};
    font-size: 13px;
    background-color: ${props => props.theme.inputs.backgroundColor};
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
      color: ${props => props.theme.inputs.placeholderColor};
    }
`

export const TextInput = (props: TextInputProps) => {

  return <Input style={props.style} type="text" autoFocus={!!props.autoFocus} placeholder={props.placeholder || ""} onChange={props.onChange}>
    {props.children}
  </Input>;
};
