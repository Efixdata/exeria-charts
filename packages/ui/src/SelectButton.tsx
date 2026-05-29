import React, { useState, useRef, ReactElement, useEffect, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { getOverlayPortalRoot, isTooltipEnabled } from "./device";
import { selectButton, buttonOption } from "../theme";
import styled from "styled-components";
import { menuOptionFocusVisibleStyles } from "../inputStyles";

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

const Trigger = styled.div`
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  border: 1px solid transparent;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  color: inherit;
  font: inherit;

  ${menuOptionFocusVisibleStyles}
`;

const OptionsContainer = styled.div<{
  $menuAlign?: "start" | "end";
  $fixedTop?: number;
  $fixedLeft?: number;
  $fixedRight?: number;
}>`
  box-sizing: border-box;
  border-radius: ${selectButton.borderRadius}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.subMenu.background};
  padding: 4px 0;
  position: ${(props) => (props.$fixedTop != null ? "fixed" : "absolute")};
  top: ${(props) =>
    props.$fixedTop != null ? `${props.$fixedTop}px` : `calc(100% + 4px)`};
  left: ${(props) => {
    if (props.$fixedLeft != null) {
      return `${props.$fixedLeft}px`;
    }
    return props.$menuAlign === "end" ? "auto" : `-${buttonOption.basePadding}px`;
  }};
  right: ${(props) => {
    if (props.$fixedRight != null) {
      return `${props.$fixedRight}px`;
    }
    return props.$menuAlign === "end" ? `-${buttonOption.basePadding}px` : "auto";
  }};
  width: max-content;
  min-width: ${(props) =>
    props.$fixedTop != null ? "120px" : `calc(100% + ${buttonOption.basePadding * 2}px)`};
  white-space: nowrap;
  z-index: 10020;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
`;

const Option = styled.div`
  display: flex;
  width: 100%;
  cursor: pointer;
  padding-left: ${buttonOption.basePadding}px;
  padding-top: ${buttonOption.basePadding}px;
  padding-right: ${buttonOption.basePadding * 4}px;
  padding-bottom: ${buttonOption.basePadding}px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  box-sizing: border-box;

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

  ${menuOptionFocusVisibleStyles}
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
  /** Align dropdown to the trigger's start (left) or end (right) edge. */
  menuAlign?: "start" | "end";
  style?: React.CSSProperties | undefined;
  ariaLabel?: string;
}

export const SelectButton = (props: SelectButtonProps) => {
  const myRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [selectedOption, setSelectedOption] = useState(props.selectedOption);
  const [isOpen, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);

  const optionIds = Object.keys(props.options);
  const useFixedMenu = !isTooltipEnabled();

  const updateMenuPosition = useCallback(() => {
    if (!useFixedMenu || !triggerRef.current) {
      setMenuPosition(null);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportPadding = 8;

    if (props.menuAlign === "end") {
      setMenuPosition({
        top: rect.bottom + 4,
        right: Math.max(viewportPadding, window.innerWidth - rect.right),
      });
      return;
    }

    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(viewportPadding, rect.left),
    });
  }, [props.menuAlign, useFixedMenu]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    updateMenuPosition();

    if (!useFixedMenu) {
      return;
    }

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, updateMenuPosition, useFixedMenu]);

  useEffect(() => {
    setSelectedOption(props.selectedOption);
  }, [props.selectedOption]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => (index + 1) % optionIds.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + optionIds.length) % optionIds.length);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(optionIds.length - 1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const id = optionIds[activeIndex];
        if (id) {
          onSelect(id);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isOpen, optionIds]);

  const openMenu = useCallback(() => {
    const currentIndex = optionIds.indexOf(selectedOption);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }, [optionIds, selectedOption]);

  const onSelect = (id: string) => {
    setSelectedOption(id);
    props.onSelect(id);
    setOpen(false);
    triggerRef.current?.focus();
  };

  function renderOptions() {
    return optionIds.map((id, index) => renderOption(props.options[id]!, id, index));
  }

  function renderOption(option: SelectButtonOption, id: string, index: number) {
    return (
      <Option
        key={option.id}
        role="option"
        aria-selected={selectedOption === option.id}
        className={selectedOption === option.id ? "active" : undefined}
        tabIndex={isOpen && activeIndex === index ? 0 : -1}
        onClick={() => onSelect(option.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(option.id);
          }
        }}
        onMouseEnter={() => setActiveIndex(index)}
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
        <>
          {selected.icon}
          {!selected.icon && selected.text}
        </>
      );
    }

    return null;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as Node;
    if (myRef.current?.contains(target) || menuRef.current?.contains(target)) {
      return;
    }
    setOpen(false);
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
    }
  };

  return (
    <Container className={isOpen ? "open" : undefined} ref={myRef} style={props.style}>
      <Trigger
        ref={triggerRef}
        role="combobox"
        tabIndex={0}
        aria-label={props.ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => (isOpen ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        {renderSelectedOption()}
      </Trigger>
      {isOpen
        ? (() => {
            const menu = (
              <OptionsContainer
                ref={menuRef}
                data-ui-select-menu="true"
                $menuAlign={props.menuAlign}
                $fixedTop={menuPosition?.top}
                $fixedLeft={menuPosition?.left}
                $fixedRight={menuPosition?.right}
                role="listbox"
                aria-label={props.ariaLabel}
                onMouseDown={(event) => event.stopPropagation()}
              >
                {renderOptions()}
              </OptionsContainer>
            );

            if (useFixedMenu && typeof document !== "undefined") {
              return createPortal(menu, getOverlayPortalRoot());
            }

            return menu;
          })()
        : null}
    </Container>
  );
};
