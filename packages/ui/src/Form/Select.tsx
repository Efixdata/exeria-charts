import * as React from "react";
import styled from "styled-components";

interface SelectProps {
  style?: React.CSSProperties;
  children?: JSX.Element|JSX.Element[];
  autoFocus?: boolean;
  onChange?: any;
  value?: string;
}

const StyledSelect = styled.select`
    color: white;
    background-color: #0F0C22;
    height: 30px;
    border-radius: 30px;
    border: none;
    outline: none;
    padding: 4px 16px;
    margin-left: -8px;
    margin-right: -8px;
    width: 144px;
    max-width: calc(100% - 16px);
    overflow: hidden;
    box-sizing: initial;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='34' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
    background-repeat: no-repeat;
    background-position-x: calc(100% - 8px);
    background-position-y: 3px;
`

export const Select = (props: SelectProps) => {

  return <StyledSelect
    style={props.style}
    autoFocus={!!props.autoFocus}
    onChange={props.onChange}
    value={props.value}
  >
    {props.children}
  </StyledSelect>;
};
