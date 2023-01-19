import React, { useState, ReactElement, useEffect, useRef, SyntheticEvent, RefObject } from "react";
import styled from "styled-components";
import { splitButton, buttonOption as buttonOption } from "../theme"; 

// @ts-ignore-next-line: Unreachable code error
import { ChevronRight } from "./img/icons/index.js";

const Container = styled.div`
  position: relative;

  &:hover .chevron, &.open .chevron {
    width: ${splitButton.buttonSize}px;
    height: ${splitButton.buttonSize}px;
    left: 0;
  }

  &:hover .chevron svg, &.open .chevron svg {
    transform: scale(1);
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

  .open &, .open:hover & {
    background-color: ${splitButton.backgroundActiveColor};
  }
`

const ChevronContainer = styled.div`
  position: relative;
  left: -${splitButton.menuPadding}px;
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
  
  & svg {
    transform: scale(0.5);
    transition: all 100ms ease-in-out;
  }
`

const OptionsContainer = styled.div<{top: number}>`
  box-sizing: border-box;
  border-radius: ${splitButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${splitButton.backgroundActiveColor};
  padding: ${splitButton.menuPadding}px 0;
  position: absolute;
  left: ${splitButton.buttonSize}px;
  top: ${props => props.top}px;
  z-index: 1;
`

const Option = styled.div`
  display: flex;
  cursor: pointer;
  padding-left: ${buttonOption.basePadding}px;
  padding-top: ${buttonOption.basePadding}px;
  padding-right: ${buttonOption.basePadding * 4}px;
  padding-bottom: ${buttonOption.basePadding}px;
  grid-gap: ${buttonOption.basePadding * 2}px;

  &:hover {
    background-color: ${buttonOption.backgroundActiveColor};
  }

  &.active {
    button {
      color: ${buttonOption.fillActiveColor};
    }
    
    & path, & circle {
      fill: ${buttonOption.fillActiveColor};
    }
  }

  & button {
    pointer-events: none;
    padding: 0;
  }
`

interface SplitButtonOption {
  text?: ReactElement
  icon: ReactElement
  callback: () => void
  id: string
}

interface SplitButtonOptions {
  [index: string]: SplitButtonOption;
}

interface SplitButtonProps {
  defaultOption: string
  options: SplitButtonOptions
  setCurrentOption?: boolean
  activeOption: string
  containerOffset: { offsetTop?: number, offsetBottom?: number}
}

export const SplitButton = (props: SplitButtonProps) => {
  const myRef = useRef<HTMLDivElement>(null);
  const buttonRef : RefObject<HTMLDivElement> = React.createRef();
  const [isOpen, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(-buttonOption.basePadding)

  const activeOptionProps : SplitButtonOption = props.options[props.activeOption || props.defaultOption];
  const currentButton = React.cloneElement(activeOptionProps.icon, {
    style: { borderRadius: 0 },
    onClick: () => onActiveOptionClick(activeOptionProps.callback),
    active: !!props.activeOption
  });

  useEffect(() => {
    setMenuPosition(calculateMenuPosition())
    // @ts-ignore
    document.addEventListener('mousedown', handleClickOutside);
    // @ts-ignore
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });

  return (
    <Container className={ (isOpen ? 'open' : undefined)} ref={myRef}>
      <ButtonContainer ref={buttonRef}>
        { currentButton }
        <ChevronContainer className="chevron" onClick={() => { setOpen(!isOpen) }}>
          <ChevronRight />
        </ChevronContainer>
      </ButtonContainer>
      { isOpen &&  
        <OptionsContainer top={menuPosition}>
          { renderOptions() }
        </OptionsContainer>
      }
    </Container>
  );

  function onOptionClick(callback: () => void) : void {
    setOpen(false);
    callback();
  }

  function onActiveOptionClick(callback: () => void) : void {
    if (isOpen) { // otwarte
      setOpen(false); // zamknąć
      if (props.activeOption) { // otwarte i aktywne
        onOptionClick.call(null, callback); // wyłączyć defaultowe
      }
    } else if (props.activeOption) { // zamknięte i aktywne
      setOpen(true); // otworzyć
    } else { // zamknięte i nieaktywne
      onOptionClick.call(null, callback); // włączyć
    }
  }

  function renderOptions() {
    const options = [];

    for (const o in props.options) {
      const option = props.options[o];
      options.push(
        <Option
        // @ts-ignore
          onClick={() => { onOptionClick(option.callback, o) }}
          key={o}
          className={ props.activeOption === o ? 'active' : undefined }
        >
          { option.icon && option.icon }
          { option.text }
        </Option>
      )
    }

    return options;
  }

  function handleClickOutside(e : SyntheticEvent) {
    // @ts-ignore
    if (!myRef.current?.contains(e.target)) {
        setOpen(false);
    }
  }

  function calculateMenuPosition() {
    const buttonOffset = buttonRef.current?.getBoundingClientRect().top;
    const containerOffset = props.containerOffset;
    let topMenuPosition = -buttonOption.basePadding;

    if (buttonOffset && containerOffset.offsetBottom) {
      const fromBottomToButton = containerOffset.offsetBottom - buttonOffset;
      const menuHeight = calculateMenuHeight();

      if (fromBottomToButton < menuHeight) {
        topMenuPosition -= menuHeight - fromBottomToButton;
      }
    }

    console.log('CALCULATE', containerOffset)
    return topMenuPosition;
  }

  function calculateMenuHeight() {
    const optionHeight = buttonOption.basePadding * 2 + splitButton.buttonSize;
    const optionsAmount = Object.keys(props.options).length;

    return optionsAmount * optionHeight + 2 * splitButton.menuPadding;
  }
};
