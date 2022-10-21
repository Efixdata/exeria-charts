import React, { useState, useRef, ReactElement, useEffect, SyntheticEvent } from "react";
import { selectButton, buttonOption } from "../theme"
import { IconButton } from "./IconButton";
import styled from "styled-components";

const Container = styled.div`
  position: relative;

  &:hover .chevron, &.open .chevron {
    width: ${selectButton.buttonSize}px;
    height: ${selectButton.buttonSize}px;
    left: 0;
  }

  &:hover .chevron img, &.open .chevron img {
    width: 6px;
  }
`

const ButtonContainer = styled.div`
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;

  &:hover {
    background-color: ${selectButton.backgroundHoverColor};
  }

  .open &, .open:hover & {
    background-color: ${selectButton.backgroundActiveColor};
  }
`

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${selectButton.backgroundActiveColor};
  padding: 4px 0;
  position: absolute;
  top: calc(-${buttonOption.basePadding}px - 4px);
  left: -${buttonOption.basePadding}px;
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


interface SelectButtonOption {
  text?: ReactElement
  icon: ReactElement
  id: string
}

interface SelectButtonOptions {
  [index: string]: SelectButtonOption;
}

interface SelectButtonProps {
  options: SelectButtonOptions;
  onSelect: (option: string|undefined) => void;
  selectedOption: string;
}

export const SelectButton = (props: SelectButtonProps) => {
  const myRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState(props.selectedOption);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  });


  return (
    <Container className={ isOpen ? 'open' : undefined } ref={myRef}>
      <ButtonContainer onClick={() => {setOpen(!isOpen)}}>
        { renderSelectedOption() }
      </ButtonContainer>
      { isOpen &&  
        <OptionsContainer>
          { renderOptions() }
        </OptionsContainer>
      }
    </Container>
  );

  function onSelect(id:string) {
    setSelectedOption(id);
    props.onSelect(id);
    setOpen(!isOpen);
  }

  function renderOptions() {
    const options = [];

    for (const o in props.options) {
      options.push(renderOption(props.options[o]));
    }

    return options;
  }

  function renderOption(option:SelectButtonOption) {
    return (
      <Option
        key={option.id}
        className={ selectedOption === option.id ? 'active' : undefined }
        onClick={() => onSelect(option.id)}
      >
        { option.icon && option.icon }
        { option.text }
      </Option>
    )
  }

  function renderSelectedOption() {
    return (
      <IconButton onClick={() => setOpen(!isOpen)}>
        { props.options[selectedOption].icon }
      </IconButton>
    )
  }

  function handleClickOutside(e : SyntheticEvent) {
    if (!myRef.current?.contains(e.target)) {
        setOpen(false);
    }
  }
};
