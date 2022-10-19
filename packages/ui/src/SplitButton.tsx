import * as React from "react";
import { ReactElement } from "react";
import styled from "styled-components";
import { splitButton, splitButtonOption } from "../theme"; 
import { IconButton } from "./IconButton";

import ChevronDown from "./img/icons/chevron_down.svg";

const Container = styled.div`
  position: relative;
`

const ButtonContainer = styled.div`
  border-radius: ${splitButton.borderRadius}px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  background-color: ${splitButton.backgroundColor};

  .active & {
    background-color: ${splitButton.activeBackgroundColor};
  }
`

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${splitButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${splitButton.activeBackgroundColor};
  padding: 4px 0;
  position: absolute;
  left: ${splitButton.buttonSize}px;
  top: 0;
`

const Option = styled.div`
  display: flex;
  padding-left: ${splitButtonOption.basePadding}px;
  padding-top: ${splitButtonOption.basePadding}px;
  padding-right: ${splitButtonOption.basePadding * 4}px;
  padding-bottom: ${splitButtonOption.basePadding}px;

  &:hover {
    background-color: ${splitButtonOption.activeBackgroundColor};
  }

  & button {
    pointer-events: none;
    padding: 0;
  }
`

const Spacer = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${splitButton.spacerColor};
`

interface Option {
  text: ReactElement
  icon?: ReactElement
}

interface SplitButtonProps {
  button: ReactElement
  options: Option[]
}

export const SplitButton = (props: SplitButtonProps) => {

  return (
    <Container className="active">
      <ButtonContainer>
        { React.cloneElement( props.button, {style: { borderRadius: 0 }} ) }
        <Spacer/>
        <IconButton image={ChevronDown.src} style={{borderRadius: 0}} />
      </ButtonContainer>
      <OptionsContainer>
        {props.options.map(option => {
          return (
            <Option>
              { option.icon && option.icon }
              { option.text }
            </Option>
          )
        })}
      </OptionsContainer>
    </Container>
  );
};
