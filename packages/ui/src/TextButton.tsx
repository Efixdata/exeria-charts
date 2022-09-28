import * as React from "react";
import styled from "styled-components";

const Button = styled.button`
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  color: #7f9dcc;

  &:hover {
    cursor: pointer;
  }

  &.active {
    color: #14f7ab;
  }
`

interface TextButtonProps {
  children?: React.ReactNode
  style?: React.CSSProperties
  onClick: () => void
  active?: boolean
}

export const TextButton = (props: TextButtonProps) => {
  return <Button onClick={props.onClick} className={props.active ? "active" : ""} style={props.style}>
    {props.children}
    </Button>;
};
