import * as React from "react";
import styled from "styled-components";

interface FormProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
}

const StyledForm = styled.form`
    color: white;
    display: flex;
    flex-direction: row;
    width: 100%;
    box-sizing: border-box;
    grid-gap: 24px 40px;
    flex-wrap: wrap;
`;

export const Form = (props: FormProps) => {

  return <StyledForm style={props.style}>
    {props.children}
  </StyledForm>;
};



