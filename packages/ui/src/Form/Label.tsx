import * as React from "react";
import styled from "styled-components";
import { labelColor } from "ui/theme";

interface LabelProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
  name: string
}

const StyledLabel = styled.label`
    color: ${labelColor};
    display: flex;
    flex-direction: column;
    align-items: start;
    gap: 6px;
    box-sizing: border-box;
    font-size: 14px;
    width: 100%;
    @media (min-width: 600px) {
      width: 170px;
    }
   
`

export const Label = (props: LabelProps) => {

  return <StyledLabel>
    {props.name}
    {props.children}
  </StyledLabel>;
};
