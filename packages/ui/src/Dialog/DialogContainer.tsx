import * as React from "react";
import styled from "styled-components";

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;

  @media (min-width: 600px) {
    flex-direction: column;
    width: 600px;
    max-width: 90vw;
    height: 600px;
    max-height: 90vh;
    border-radius: var(--ui-radius-md, 6px);
  }

  color: ${(props) => props.theme.dialog.textColor};
  background-color: ${(props) => props.theme.dialog.backgroundColor};
  overflow: hidden;
  box-shadow: 8px 8px 24px 0px rgba(0, 0, 0, 1);
`;

interface DialogContainerProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export const DialogContainer = (props: DialogContainerProps) => {
  return (
    <Container
      role="dialog"
      aria-modal="true"
      aria-label={props.ariaLabelledBy ? undefined : props.ariaLabel}
      aria-labelledby={props.ariaLabelledBy}
      style={props.style}
    >
      {props.children}
    </Container>
  );
};
