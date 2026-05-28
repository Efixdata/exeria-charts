import * as React from "react";
import styled from "styled-components";
import { Headline } from "./Headline";
import { menuOptionFocusVisibleStyles } from "../inputStyles";

const Item = styled.button`
  display: block;
  width: 100%;
  margin: 0;
  padding: var(--ui-space-2, 8px);
  border: 1px solid transparent;
  border-radius: var(--ui-radius-md, 6px);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.dialog.itemHoverBackgroundColor};
  }

  ${menuOptionFocusVisibleStyles}
`;

interface ListItemProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  onClick?: (() => void) | undefined;
  title: string;
  subtitle?: string | undefined;
}

export const ListItem = (props: ListItemProps) => {
  return (
    <Item type="button" style={props.style} onClick={props.onClick}>
      <Headline title={props.title} subtitle={props.subtitle} />
      {props.children}
    </Item>
  );
};
