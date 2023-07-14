import * as React from "react";
import styled from "styled-components";
import { Icon } from "./Icon";

const Button = styled.button<{themeContext: string}>`
  display: contents;
  &>div:hover, &>div:focus {
      background-color:  ${props => {
        const parent = props.themeContext === 'buttons' ? props.theme.buttons : props.theme[props.themeContext].buttons
        return parent['hoverBackground'];
      }};
      cursor: pointer;
    }
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
  themeContext?: string
}

export const IconButton = (props: IconButtonProps) => {
  return <Button onClick={props.onClick} themeContext={props.themeContext || 'buttons'}>
    <Icon { ...props}>
      {props.children}
    </Icon>
  </Button>;
};
