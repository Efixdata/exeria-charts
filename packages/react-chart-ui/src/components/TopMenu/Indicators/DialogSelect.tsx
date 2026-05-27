import * as React from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import { CaretDown } from "phosphor-react";
import { Portal } from "react-portal";
import { CHART_UI_OVERLAY_ATTRIBUTE } from "ui";

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
  height: 30px;
  padding: 4px 12px 4px 14px;
  border: none;
  border-radius: 30px;
  cursor: pointer;
  box-sizing: border-box;
  color: ${(props) => props.theme.inputs.textColor};
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  font-size: 13px;
  font-family: inherit;
  text-align: left;

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.accentColor};
    outline-offset: 2px;
  }
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
  padding: 4px;
  border-radius: 6px;
  background-color: ${(props) => props.theme.subMenu.background};
  border: ${(props) => props.theme.border?.inner || "1px solid rgba(255, 255, 255, 0.1)"};
  box-shadow: 8px 8px 24px rgba(0, 0, 0, 0.45);
  overflow-y: auto;
  box-sizing: border-box;

  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.scrollBar.thumbColor}
    ${(props) => props.theme.scrollBar.trackColor};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollBar.trackColor};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.scrollBar.thumbColor};
    border-radius: 3px;
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
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
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

  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? { value: "", label: "" };

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
  };

  const menu =
    isOpen && menuPlacement && options.length > 0 ? (
      <Menu
        ref={menuRef}
        role="listbox"
        aria-label={ariaLabel}
        $placement={menuPlacement}
        {...{ [CHART_UI_OVERLAY_ATTRIBUTE]: "" }}
      >
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <OptionButton
              key={option.value}
              type="button"
              role="option"
              aria-selected={isActive}
              $active={isActive}
              onMouseDown={(event) => event.stopPropagation()}
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
        onClick={() => setOpen((open) => !open)}
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
