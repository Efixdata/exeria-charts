import * as React from "react";
import styled from "styled-components";
import { Icon } from "./Icon";

const Button = styled.button`
  display: contents;
`

interface IconButtonProps {
  children?: JSX.Element|JSX.Element[]
  image?: string
  imageAlt?: string
  imageType?: string
  callback?: () => void
  style?: React.CSSProperties
  iconStyle?: React.CSSProperties
  onClick?: () => void
  active?: boolean
  id?: string
}

export const IconButton = (props: IconButtonProps) => {
  return <Button onClick={props.onClick} >
    <Icon { ...props}>
      {props.children}
    </Icon>
  </Button>;
};
