import * as React from "react";
import { ReactElement } from "react";
import { radioButton } from "../theme"; 
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  width: fit-content;
  border-radius: ${radioButton.borderRadius}px;
  overflow: hidden;
  background-color: ${radioButton.backgroundColor};
  grid-gap: ${radioButton.gap}px;
`

interface RadioButtonProps {
  buttons: ReactElement[];
  style?: React.CSSProperties
  onClick?: () => void
  horizontal?: true
}

export const RadioButton = (props: RadioButtonProps) => {
  const buttons = renderButtons()

  return (
    <Container style={{ flexDirection: props.horizontal ? 'row' : 'column' }}>
      {buttons}
    </Container>
  )

  function onSelectOption(props) {
    // TODO: set active button and change icon color
    props.callback();
  }
  
  function renderButtons() {
    return props.buttons.map((button : ReactElement) => {
      return React.cloneElement( button, {
        onClick: onSelectOption.bind(null, button.props),
        style: { borderRadius: 0 }
      });
    });
  };
};