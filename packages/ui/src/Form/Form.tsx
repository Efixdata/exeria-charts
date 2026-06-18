import * as React from "react";
import styled from "styled-components";

interface FormProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  onSubmit: React.FormEventHandler<HTMLFormElement> | undefined;
}

const StyledForm = styled.form`
  color: ${(props) => props.theme.dialog.textColor};
  display: flex;
  flex-direction: row;
  width: 100%;
  box-sizing: border-box;
  grid-gap: var(--ui-space-4, 16px);
  flex-wrap: wrap;
  align-items: stretch;
`;

export const Form = (props: FormProps) => {
  return (
    <StyledForm style={props.style} onSubmit={props.onSubmit}>
      {props.children}
    </StyledForm>
  );
};
