import * as React from "react";
import styled from "styled-components";

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  padding: var(--ui-space-6, 24px) var(--ui-space-5, 20px);
  border-bottom: 1px solid ${(props) => props.theme.dialog.dividerColor};
  color: ${(props) => props.theme.dialog.titleColor};
  font-size: var(--ui-font-title, 14px);
`;

export const DialogHeaderTitle = styled.span`
  flex: 1;
  min-width: 0;
`;

export const DialogHeaderActions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: auto;
`;

interface DialogHeaderProps {
  children?: React.ReactNode;
}

export const DialogHeader = (props: DialogHeaderProps) => {
  return <Header>{props.children}</Header>;
};
