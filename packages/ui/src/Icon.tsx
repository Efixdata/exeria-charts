import * as React from "react";
import styled from "styled-components";
import { iconButton } from "../theme"; 

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  width: ${iconButton.buttonSize}px;
  height: ${iconButton.buttonSize}px;
  border-radius: ${iconButton.borderRadius}px;

  path, circle {
    fill: ${props => props.theme.icons.color };
  }

  &.active {
    path, circle {
      fill: ${props => props.theme.icons.activeColor };
    }
  }

  picture {
    display: contents;
  }

  img, svg {
    width: ${iconButton.iconSize}px;
    height: ${iconButton.iconSize}px;
    margin: 0 auto;
  }
`

interface IconProps {
  children?: JSX.Element|JSX.Element[]
  image?: string
  imageAlt?: string
  imageType?: string
  style?: React.CSSProperties
  iconStyle?: React.CSSProperties
  active?: boolean
  id?: string
}

export const Icon = (props: IconProps) => {

  const renderImage = () => {
    if (props.image)
      return (<picture>
        <source srcSet={props.image} type={props.imageType}/>
        <img src={props.image} alt={props.imageAlt} style={props.iconStyle}/>
      </picture>);
  }

  return <IconContainer className={props.active ? "active" : ""} style={props.style}>
    {renderImage()}
    {props.children}
  </IconContainer>;
};
