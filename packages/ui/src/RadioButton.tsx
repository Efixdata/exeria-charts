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
  horizontal?: true
  currentButton: string
  defaultButton: string
  onSelect: (id: string) => void
}

export const RadioButton = (props: RadioButtonProps) => {
  const buttons = renderButtons()

  return (
    <Container style={{ flexDirection: props.horizontal ? 'row' : 'column' }}>
      {buttons}
    </Container>
  )

  function onSelectOption(clickedButton: any) {
    const id = clickedButton.id;

    if (id === props.currentButton && id !== props.defaultButton) {
      props.onSelect(props.defaultButton);
    } else {
      props.onSelect(id);
    }
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