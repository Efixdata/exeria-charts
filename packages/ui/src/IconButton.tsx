import * as React from "react";
import styled from "styled-components";

const Button = styled.button`
  background-color: transparent;
  width: 30px;
  height: 30px;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  border-radius: 5px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    cursor: pointer;
  }

  &.active {
    background-color: rgba(255, 255, 255, 0.2);
  }
`

interface IconButtonProps {
  children?: JSX.Element|JSX.Element[]
  image?: string
  imageAlt?: string
  imageType?: string
  style?: React.CSSProperties
  onClick?: () => void
  active?: boolean
}

export const IconButton = (props: IconButtonProps) => {

  const renderImage = () => {
    if (props.image)
      return (<picture>
        <source srcSet={props.image} type={props.imageType}/>
        <img src={props.image} alt={props.imageAlt} style={{ width: "30px", height: "30px" }}/>
      </picture>);
  }

  return <Button onClick={props.onClick} className={props.active ? "active" : ""}>
    {renderImage()}
    {props.children}
    </Button>;
};
