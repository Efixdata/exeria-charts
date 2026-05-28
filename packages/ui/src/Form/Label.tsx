import * as React from "react";
import styled from "styled-components";

interface LabelProps {
  children?: JSX.Element | JSX.Element[];
  style?: React.CSSProperties | undefined;
  name: string;
  htmlFor?: string;
}

const StyledLabel = styled.label`
  color: ${(props) => props.theme.inputs.labelColor};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--ui-space-2, 8px);
  box-sizing: border-box;
  font-size: var(--ui-font-label, 12px);
  font-weight: 500;
  line-height: 1.35;
  width: 100%;
`;

export const Label = (props: LabelProps) => {
  return (
    <StyledLabel style={props.style} htmlFor={props.htmlFor}>
      {props.name}
      {props.children}
    </StyledLabel>
  );
};
