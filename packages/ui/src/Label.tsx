import * as React from "react";
import styled from "styled-components";

interface LabelProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  name: string
}

const StyledLabel = styled.label`
    color: white;
`

export const Label = (props: LabelProps) => {

  return <StyledLabel>
    {props.name}
    {props.children}
  </StyledLabel>;
};
