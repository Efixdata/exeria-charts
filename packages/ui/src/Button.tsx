import * as React from "react";

interface ButtonProps {
  children?: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}

export const Button = (props: ButtonProps) => {

  return <button style={props.style} onClick={props.onClick}>
    {props.children}
  </button>;
};
