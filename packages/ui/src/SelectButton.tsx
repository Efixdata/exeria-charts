import React, { useState, useRef, ReactElement, useEffect, SyntheticEvent } from "react";
import { selectButton, buttonOption } from "../theme";
import { IconButton } from "./IconButton";
import styled from "styled-components";
import { Icon } from "./Icon";

const Container = styled.div`
  position: relative;

  &:hover .chevron,
  &.open .chevron {
    width: ${selectButton.buttonSize}px;
    height: ${selectButton.buttonSize}px;
    left: 0;
  }

  &:hover .chevron img,
  &.open .chevron img {
    width: 6px;
  }
`;

const ButtonContainer = styled.div`
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
`;

const OptionsContainer = styled.div`
  box-sizing: border-box;
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.subMenu.background};
  padding: 4px 0;
  position: absolute;
  top: calc(-${buttonOption.basePadding}px - 4px);
  left: -${buttonOption.basePadding}px;
  z-index: 1;
`;

const Option = styled.div`
  display: flex;
  cursor: pointer;
  padding-left: ${buttonOption.basePadding}px;
  padding-top: ${buttonOption.basePadding}px;
  padding-right: ${buttonOption.basePadding * 4}px;
  padding-bottom: ${buttonOption.basePadding}px;

  &:hover {
    background-color: ${(props) => props.theme.subMenu.buttons.hoverBackground};

    button > div,
    button {
      background-color: transparent !important;
    }
  }

  &.active {
    background-color: ${(props) => props.theme.subMenu.buttons.activeBackground};

    button {
      color: ${(props) => props.theme.subMenu.buttons.activeColor};
    }
    path,
    circle {
      fill: ${(props) => props.theme.subMenu.buttons.activeColor};
    }
  }
`;

interface SelectButtonOption {
  text?: ReactElement;
  icon?: ReactElement;
  id: string;
}

interface SelectButtonOptions {
  [index: string]: SelectButtonOption;
}

interface SelectButtonProps {
  options: SelectButtonOptions;
  onSelect: (option: string | undefined) => void;
  selectedOption: string;
  style?: React.CSSProperties;
}

export const SelectButton = (props: SelectButtonProps) => {
  const myRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState(props.selectedOption);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    setSelectedOption(props.selectedOption);
    // @ts-ignore
    document.addEventListener("mousedown", handleClickOutside);
    // @ts-ignore
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <Container className={isOpen ? "open" : undefined} ref={myRef} style={props.style}>
      <ButtonContainer
        onClick={() => {
          setOpen(!isOpen);
        }}
      >
        {renderSelectedOption()}
      </ButtonContainer>
      {isOpen && <OptionsContainer>{renderOptions()}</OptionsContainer>}
    </Container>
  );

  function onSelect(id: string) {
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

  function renderOption(option: SelectButtonOption) {
    return (
      <Option
        key={option.id}
        className={selectedOption === option.id ? "active" : undefined}
        onClick={() => onSelect(option.id)}
      >
        {option.icon && option.icon}
        {option.text && option.text}
      </Option>
    );
  }

  function renderSelectedOption() {
    const selected = props.options[selectedOption];

    if (selected) {
      return (
        <div onClick={() => setOpen(!isOpen)}>
          {selected.icon}
          {!selected.icon && selected.text}
        </div>
      );
    } else {
      return <></>;
    }
  }

  function handleClickOutside(e: SyntheticEvent) {
    // @ts-ignore
    if (!myRef.current?.contains(e.target)) {
      setOpen(false);
    }
  }
};
