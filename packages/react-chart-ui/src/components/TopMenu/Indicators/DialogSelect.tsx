import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import { CaretDown } from "phosphor-react";
import { Portal } from "react-portal";
import { CHART_UI_OVERLAY_ATTRIBUTE, UI_RADIUS } from "ui";
import { inputBorderRadius } from "ui/theme";
import { inputFocusVisibleStyles, menuOptionFocusVisibleStyles } from "ui/inputStyles";

const MENU_GAP = 6;
const MENU_MAX_HEIGHT = 260;
const MENU_Z_INDEX = 10001;
const VIEWPORT_PADDING = 8;
const OPTION_HEIGHT_ESTIMATE = 38;

export type DialogSelectOption = {
  value: string;
  label: string;
};

type MenuPlacement = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

const Root = styled.div`
  position: relative;
  width: 100%;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: var(--ui-input-height, 36px);
  padding: var(--ui-space-1, 4px) var(--ui-space-3, 12px) var(--ui-space-1, 4px) 14px;
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  border-radius: ${inputBorderRadius};
  cursor: pointer;
  box-sizing: border-box;
  color: ${(props) => props.theme.inputs.textColor};
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  font-size: var(--ui-font-body, 13px);
  font-family: inherit;
  text-align: left;

  ${inputFocusVisibleStyles}
`;

const TriggerLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChevronWrap = styled.span<{ $open: boolean }>`
  display: flex;
  align-items: center;
  flex-shrink: 0;
  color: ${(props) => props.theme.inputs.placeholderColor};
  transform: rotate(${(props) => (props.$open ? "180deg" : "0deg")});
  transition: transform 0.15s ease;
`;

const Menu = styled.div<{ $placement: MenuPlacement }>`
  position: fixed;
  left: ${(props) => props.$placement.left}px;
  width: ${(props) => props.$placement.width}px;
  max-height: ${(props) => props.$placement.maxHeight}px;
  ${(props) =>
    props.$placement.top !== undefined ? `top: ${props.$placement.top}px;` : ""}
  ${(props) =>
    props.$placement.bottom !== undefined ? `bottom: ${props.$placement.bottom}px;` : ""}
  z-index: ${MENU_Z_INDEX};
  padding: var(--ui-space-1, 4px);
  border-radius: ${UI_RADIUS.lg};
  background-color: ${(props) => props.theme.subMenu.background};
  border: ${(props) => props.theme.border?.inner || "1px solid rgba(255, 255, 255, 0.1)"};
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.45);
  overflow-y: auto;
  box-sizing: border-box;

  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.scrollBar.thumbColor}
    ${(props) => props.theme.scrollBar.trackColor};

  &::-webkit-scrollbar {
    width: var(--dialog-scrollbar-width, 8px);
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollBar.trackColor};
    border-radius: var(--ui-radius-md, 6px);
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.scrollBar.thumbColor};
    border-radius: var(--ui-radius-md, 6px);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.scrollBar.thumbHoverColor};
  }
`;

const OptionButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: var(--ui-space-2, 8px) var(--ui-space-3, 12px);
  border: none;
  border-radius: ${UI_RADIUS.md};
  cursor: pointer;
  font-size: var(--ui-font-body, 13px);
  font-family: inherit;
  text-align: left;
  color: ${(props) =>
    props.$active ? props.theme.subMenu.buttons?.activeColor : props.theme.dialog.textColor};
  background-color: ${(props) =>
    props.$active ? props.theme.subMenu.buttons?.activeBackground : "transparent"};

  &:hover {
    background-color: ${(props) => props.theme.subMenu.buttons?.hoverBackground};
    color: ${(props) => props.theme.subMenu.buttons?.hoverColor};
  }

  ${menuOptionFocusVisibleStyles}
`;

const OptionLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function calculateMenuPlacement(trigger: HTMLElement, optionCount: number): MenuPlacement {
  const rect = trigger.getBoundingClientRect();
  const preferredHeight = Math.min(
    MENU_MAX_HEIGHT,
    optionCount * OPTION_HEIGHT_ESTIMATE + 8,
  );
  const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_PADDING;
  const spaceAbove = rect.top - MENU_GAP - VIEWPORT_PADDING;
  const openUpward = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

  if (openUpward) {
    return {
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(120, Math.min(preferredHeight, spaceAbove)),
      bottom: window.innerHeight - rect.top + MENU_GAP,
    };
  }

  return {
    left: rect.left,
    width: rect.width,
    maxHeight: Math.max(120, Math.min(preferredHeight, spaceBelow)),
    top: rect.bottom + MENU_GAP,
  };
}

export interface DialogSelectProps {
  value: string;
  options: DialogSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  renderOptionPrefix?: (option: DialogSelectOption, isActive: boolean) => React.ReactNode;
  renderTriggerPrefix?: (selectedOption: DialogSelectOption) => React.ReactNode;
}

export const DialogSelect = ({
  value,
  options,
  onChange,
  ariaLabel,
  renderOptionPrefix,
  renderTriggerPrefix,
}: DialogSelectProps) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const listboxId = React.useId();

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? { value: "", label: "" };

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const updateMenuPlacement = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }

    setMenuPlacement(calculateMenuPlacement(triggerRef.current, options.length));
  }, [options.length]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPlacement(null);
      return;
    }

    updateMenuPlacement();
  }, [isOpen, updateMenuPlacement]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleReposition = () => updateMenuPlacement();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, updateMenuPlacement]);

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
        setActiveIndex((index) => (index + 1) % options.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index - 1 + options.length) % options.length);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        setActiveIndex(options.length - 1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) {
          selectOption(option.value);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, isOpen, options]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selectOption = (nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const openMenu = () => {
    setActiveIndex(selectedIndex);
    setOpen(true);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      if (!isOpen) {
        openMenu();
      }
    }
  };

  const menu =
    isOpen && menuPlacement && options.length > 0 ? (
      <Menu
        ref={menuRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        $placement={menuPlacement}
        {...{ [CHART_UI_OVERLAY_ATTRIBUTE]: "" }}
      >
        {options.map((option, index) => {
          const isActive = option.value === value;

          return (
            <OptionButton
              key={option.value}
              type="button"
              role="option"
              aria-selected={isActive}
              tabIndex={activeIndex === index ? 0 : -1}
              $active={isActive}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option.value)}
            >
              {renderOptionPrefix?.(option, isActive)}
              <OptionLabel>{option.label}</OptionLabel>
            </OptionButton>
          );
        })}
      </Menu>
    ) : null;

  return (
    <Root>
      <Trigger
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        onClick={() => (isOpen ? setOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        {selectedOption && renderTriggerPrefix?.(selectedOption)}
        <TriggerLabel>{selectedOption?.label ?? ""}</TriggerLabel>
        <ChevronWrap $open={isOpen}>
          <CaretDown size={14} weight="bold" />
        </ChevronWrap>
      </Trigger>

      {menu ? <Portal>{menu}</Portal> : null}
    </Root>
  );
};
