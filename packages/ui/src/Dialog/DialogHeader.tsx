import * as React from "react";
import styled from "styled-components";

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 24px 20px;
  border-bottom: 1px solid ${(props) => props.theme.dialog.dividerColor};
  color: ${(props) => props.theme.dialog.titleColor};
  font-size: 14px;
`;

interface DialogHeaderProps {
  children?: JSX.Element | JSX.Element[] | string;
}

export const DialogHeader = (props: DialogHeaderProps) => {
  return <Header>{props.children}</Header>;
};
