import * as React from "react";
import styled from "styled-components";
import { Headline } from "./Headline";

const Item = styled.div`
  padding: 6px 8px;
  border-radius: 6px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    cursor: pointer;
  }
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
    <Item style={props.style} onClick={props.onClick}>
      <Headline title={props.title} subtitle={props.subtitle} />
      {props.children}
    </Item>
  );
};
