import * as React from "react";
import styled from "styled-components";
import { iconButton } from "../theme"; 

const Button = styled.button`
  background-color: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  width: ${iconButton.buttonSize}px;
  height: ${iconButton.buttonSize}px;
  border-radius: ${iconButton.borderRadius}px;

  &:hover, &.focus {
    background-color: ${iconButton.backgroundActiveColor};
    cursor: pointer;
  }

  &.active {
    path, circle {
      fill: ${iconButton.iconActiveColor};
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

  const renderImage = () => {
    if (props.image)
      return (<picture>
        <source srcSet={props.image} type={props.imageType}/>
        <img src={props.image} alt={props.imageAlt} style={props.iconStyle}/>
      </picture>);
  }

  return <Button onClick={props.onClick} className={props.active ? "active" : ""} style={props.style}>
    {renderImage()}
    {props.children}
  </Button>;
};
