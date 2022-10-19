import React, { useState, ReactElement, useEffect, useRef } from "react";
import styled from "styled-components";
import { splitButton, splitButtonOption } from "../theme"; 

import Chevron from "./img/icons/chevron_right_no_margins.svg";

const Container = styled.div`
  position: relative;

  &:hover .chevron, &.active .chevron {
    width: ${splitButton.buttonSize}px;
    height: ${splitButton.buttonSize}px;
    left: 0;
  }

  &:hover .chevron img, &.active .chevron img {
    width: 6px;
  }
`

const ButtonContainer = styled.div`
  border-radius: ${splitButton.borderRadius}px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;

  &:hover {
    background-color: ${splitButton.backgroundHoverColor};
  }

  .active &, .active:hover & {
    background-color: ${splitButton.backgroundActiveColor};
  }
`

const ChevronContainer = styled.div`
  position: relative;
  left: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 100ms ease-in-out;
  cursor: pointer;
  padding: 2px;
  box-sizing: border-box;

  &:hover {
    background-color: ${splitButton.buttonHoverColor};
  }
  
  & img {
    width: 4px;
    transition: all 100ms ease-in-out;
  }
`

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${splitButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${splitButton.backgroundActiveColor};
  padding: 4px 0;
  position: absolute;
  left: ${splitButton.buttonSize}px;
  top: -${splitButtonOption.basePadding}px;
`

const Option = styled.div`
  display: flex;
  cursor: pointer;
  padding-left: ${splitButtonOption.basePadding}px;
  padding-top: ${splitButtonOption.basePadding}px;
  padding-right: ${splitButtonOption.basePadding * 4}px;
  padding-bottom: ${splitButtonOption.basePadding}px;

  &:hover {
    background-color: ${splitButtonOption.backgroundActiveColor};
  }

  & button {
    pointer-events: none;
    padding: 0;
  }
`

interface Option {
  text?: ReactElement
  icon?: ReactElement
  callback?: () => void
  id: string
}

interface SplitButtonProps {
  defaultOption: string
  options: Option<>
  setCurrentOption?: boolean
  activeOption?: string
}

export const SplitButton = (props: SplitButtonProps) => {
  const setCurrentOption = typeof props.setCurrentOption !== 'undefined' ? props.setCurrentOption : true;
  const myRef = useRef();

  const [isOpen, setOpen] = useState(false);
  const [activeOption, setActiveOption] = useState(props.activeOption);

  useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  const activeOptionProps = props.options[activeOption || props.defaultOption];

  const currentButton = React.cloneElement(activeOptionProps.icon, {
    style: { borderRadius: 0 },
    onClick: () => onActiveOptionClick(activeOptionProps.callback)
  });

  return (
    <Container className={ isOpen && 'active' } ref={myRef}>
      <ButtonContainer>
        { currentButton }
        <ChevronContainer className="chevron" onClick={() => { setOpen(!isOpen) }}>
          <img src={Chevron.src} />
        </ChevronContainer>
      </ButtonContainer>
      { isOpen &&  
        <OptionsContainer>
          { renderOptions() }
        </OptionsContainer>
      }
    </Container>
  );

  function onOptionClick(callback: () => void, optionId: string) : void {
    setOpen(false);
    if (setCurrentOption) { setActiveOption(optionId) }
    callback();
  }

  function onActiveOptionClick(callback: () => void) : void {
    if (!activeOption) {
      onOptionClick.call(null, callback, props.defaultOption)
    }
  }

  function renderOptions() {
    const options = [];

    for (const o in props.options) {
      const option = props.options[o];
      options.push(
        <Option onClick={() => { onOptionClick(option.callback, o) }} key={o}>
          { option.icon && option.icon }
          { option.text }
        </Option>
      )
    }

    return options;
  }

  function handleClickOutside(e) {
    if (!myRef.current.contains(e.target)) {
        setOpen(false);
    }
};
};
