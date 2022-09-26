import * as React from "react";

interface ButtonProps {
  children?: JSX.Element
  style?: React.CSSProperties
  onClick?: () => void
}

export const Button = (props: ButtonProps) => {

  return <button style={props.style} onClick={props.onClick}>
    {props.children}
    </button>;
};
