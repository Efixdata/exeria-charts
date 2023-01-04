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
    color: white;
    font-size: 13px;
    background-color: #0F0C22;
    height: 30px;
    border-radius: 30px;
    border: none;
    outline: none;
    padding: 4px 16px;
    margin-left: -8px;
    margin-right: -8px;
    width: calc(100% - 16px);

    &::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
`

export const TextInput = (props: TextInputProps) => {

  return <Input style={props.style} type="text" autoFocus={!!props.autoFocus} placeholder={props.placeholder || ""} onChange={props.onChange}>
    {props.children}
  </Input>;
};
