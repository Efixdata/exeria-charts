import React, { useState, ReactElement, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { ThemeProvider, useTheme } from "styled-components";
import { splitButton } from "../theme";
import { UI_FONT_FAMILY } from "../theme";
import { inputFocusVisibleStyles } from "../inputStyles";
import { toolbarIconSvgStyles } from "./toolbarIconStyles";
import { getOverlayPortalRoot } from "./device";
import { Tooltip } from "./Tooltip";

const Container = styled.div`
  position: relative;
  display: block;
  flex-shrink: 0;
  overflow: visible;
  width: var(--ui-toolbar-touch, ${splitButton.buttonSize}px);
  height: var(--ui-toolbar-touch, ${splitButton.buttonSize}px);
  margin-inline: auto;
`;

const ButtonContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: ${splitButton.borderRadius}px;
  box-sizing: border-box;
  overflow: visible;

  .open &,
  .open:hover & {
    background-color: ${(props) => props.theme.splitButton.openBackground};

    path,
    circle {
      fill: ${(props) => props.theme.splitButton.openColor};
    }
  }
`;

const IconSlot = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
  color: ${(props) => props.theme.toolbar.buttons.color};

  ${Container}.pressed & {
    color: ${(props) => props.theme.toolbar.buttons.activeColor};
  }

  ${toolbarIconSvgStyles}
`;

const MainHitAreaSlot = styled.span`
  position: absolute;
  top: 0;
  left: 0;
  width: calc(
    var(--ui-toolbar-touch, ${splitButton.buttonSize}px) - var(--ui-split-chevron-hit, 20px) +
      (var(--ui-left-menu-width, ${splitButton.buttonSize}px) - var(--ui-toolbar-touch, ${splitButton.buttonSize}px)) / 2
  );
  height: 100%;
  z-index: 2;

  > span {
    width: 100%;
    height: 100%;
    display: block;
  }
`;

const MainHitArea = styled.button`
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: inherit;

  ${inputFocusVisibleStyles}
`;

const ChevronHitArea = styled.button`
  position: absolute;
  top: 0;
  right: calc(
    (var(--ui-toolbar-touch, ${splitButton.buttonSize}px) - var(--ui-left-menu-width, ${splitButton.buttonSize}px)) / 2
  );
  width: var(--ui-split-chevron-hit, 20px);
  height: 100%;
  margin: 0;
  padding: 0 0 4px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  z-index: 3;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  color: ${(props) => props.theme.splitButton.arrowColor};

  &:hover {
    color: ${(props) => props.theme.splitButton.arrowOpenColor ?? props.theme.splitButton.openColor};
  }

  ${inputFocusVisibleStyles}
`;

const ChevronMark = styled.span`
  display: block;
  width: 4px;
  height: 4px;
  margin: 0 1px 1px 0;
  border-top: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  transform: rotate(45deg);
  flex-shrink: 0;
  pointer-events: none;
`;

const OptionsContainer = styled.div<{ $top: number; $left: number; $maxHeight: number }>`
  box-sizing: border-box;
  border-radius: ${splitButton.borderRadius}px;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.subMenu.background};
  padding: ${splitButton.menuPadding}px 0;
  position: fixed;
  left: ${(props) => props.$left}px;
  top: ${(props) => props.$top}px;
  z-index: 10001;
  min-width: 180px;
  max-height: ${(props) => props.$maxHeight}px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  scrollbar-width: thin;
  scrollbar-color: rgba(127, 157, 204, 0.35) transparent;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(127, 157, 204, 0.35);
    border-radius: 4px;
  }
`;

const OptionIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${splitButton.menuOptionHeight}px;
  height: ${splitButton.menuOptionHeight}px;
  flex-shrink: 0;
  color: ${(props) => props.theme.subMenu.buttons.color};

  svg {
    width: ${splitButton.menuIconSize}px;
    height: ${splitButton.menuIconSize}px;
  }

  ${toolbarIconSvgStyles}
`;

const OptionLabel = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ${UI_FONT_FAMILY};
  font-size: var(--ui-font-body, 13px);
  line-height: 1.2;
  color: ${(props) => props.theme.subMenu.buttons.color};
`;

const Option = styled.div`
  display: grid;
  grid-template-columns: ${splitButton.menuOptionHeight}px 1fr;
  align-items: center;
  column-gap: 8px;
  cursor: pointer;
  min-height: ${splitButton.menuOptionHeight}px;
  padding: 0 12px 0 8px;
  flex-shrink: 0;

  &:hover {
    background-color: ${(props) => props.theme.subMenu.buttons.hoverBackground};
  }

  &.active {
    background-color: ${(props) => props.theme.subMenu.buttons.activeBackground};

    ${OptionIcon} {
      color: ${(props) => props.theme.subMenu.buttons.activeColor};
    }

    ${OptionLabel} {
      color: ${(props) => props.theme.subMenu.buttons.activeColor};
    }
  }
`;

function MenuExpandChevron() {
  return <ChevronMark aria-hidden />;
}

export interface SplitButtonOption {
  label: string;
  icon: ReactElement;
  callback: () => void;
  id: string;
}

export interface SplitButtonOptions {
  [index: string]: SplitButtonOption;
}

export interface SplitButtonProps {
  defaultOption: string;
  options: SplitButtonOptions;
  setCurrentOption?: boolean | undefined;
  activeOption?: string | undefined;
  pressed?: boolean;
  onMainDoubleClick?: () => void;
  onMainClickWhileActive?: () => void;
  onChevronClick?: () => boolean | void;
  containerOffset: { offsetTop?: number; offsetBottom?: number };
}

interface MenuPosition {
  top: number;
  left: number;
  maxHeight: number;
}

export const SplitButton = (props: SplitButtonProps) => {
  const theme = useTheme();
  const myRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition>({
    top: 0,
    left: 0,
    maxHeight: 480,
  });

  const activeOptionProps: SplitButtonOption | undefined =
    props.options[props.activeOption || props.defaultOption];

  if (!activeOptionProps) {
    return null;
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuPosition = () => {
      setMenuPosition(calculateMenuPosition());
    };

    updateMenuPosition();
    const frame = window.requestAnimationFrame(updateMenuPosition);

    const scrollRoot =
      myRef.current?.closest(".leftMenuScroll") ??
      myRef.current?.closest(".wrapperInner");

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    scrollRoot?.addEventListener("scroll", updateMenuPosition, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      scrollRoot?.removeEventListener("scroll", updateMenuPosition);
    };
  }, [isOpen, props.containerOffset.offsetBottom, props.containerOffset.offsetTop]);

  const menuPortal =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <ThemeProvider theme={theme}>
            <OptionsContainer
              ref={menuRef}
              data-split-button-menu="true"
              $top={menuPosition.top}
              $left={menuPosition.left}
              $maxHeight={menuPosition.maxHeight}
            >
              {renderOptions()}
            </OptionsContainer>
          </ThemeProvider>,
          getOverlayPortalRoot(),
        )
      : null;

  return (
    <Container
      className={[isOpen ? "open" : undefined, props.pressed ? "pressed" : undefined]
        .filter(Boolean)
        .join(" ") || undefined}
      ref={myRef}
    >
      <ButtonContainer>
        <IconSlot aria-hidden>{activeOptionProps.icon}</IconSlot>
        <MainHitAreaSlot>
          <Tooltip label={activeOptionProps.label} placement="right">
            <MainHitArea
              type="button"
              aria-label={activeOptionProps.label}
              aria-pressed={props.activeOption ? true : undefined}
              onClick={() => onActiveOptionClick(activeOptionProps.callback)}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                props.onMainDoubleClick?.();
              }}
            />
          </Tooltip>
        </MainHitAreaSlot>
        <ChevronHitArea
          type="button"
          className="chevron"
          aria-label="Show more tools"
          aria-expanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            if (props.onChevronClick?.()) {
              return;
            }
            setOpen(!isOpen);
          }}
        >
          <MenuExpandChevron />
        </ChevronHitArea>
      </ButtonContainer>
      {menuPortal}
    </Container>
  );

  function onOptionClick(callback: () => void): void {
    setOpen(false);
    callback();
  }

  function onActiveOptionClick(callback: () => void): void {
    if (isOpen) {
      setOpen(false);
    }

    if (props.activeOption && props.onMainClickWhileActive) {
      props.onMainClickWhileActive();
      return;
    }

    callback();
  }

  function renderOptions() {
    const options: JSX.Element[] = [];

    for (const o in props.options) {
      const option = props.options[o];
      if (!option) continue;
      options.push(
        <Option
          onClick={() => {
            onOptionClick(option.callback);
          }}
          key={o}
          className={props.activeOption === o ? "active" : undefined}
        >
          <OptionIcon aria-hidden>{option.icon}</OptionIcon>
          <OptionLabel>{option.label}</OptionLabel>
        </Option>,
      );
    }

    return options;
  }

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as Node;
    if (myRef.current?.contains(target) || menuRef.current?.contains(target)) {
      return;
    }

    setOpen(false);
  }

  function getClipBounds() {
    const chartRow =
      myRef.current?.closest("[data-chart-area]")?.parentElement ??
      myRef.current?.closest(".wrapperInner") ??
      myRef.current?.closest(".wrapperOuter");
    const chartRowRect = chartRow?.getBoundingClientRect();
    const containerOffset = props.containerOffset;

    return {
      top: chartRowRect?.top ?? containerOffset.offsetTop ?? 0,
      bottom: chartRowRect?.bottom ?? containerOffset.offsetBottom ?? window.innerHeight,
    };
  }

  function calculateMenuPosition(): MenuPosition {
    const containerRect = myRef.current?.getBoundingClientRect();
    const menuHeight = calculateMenuHeight();
    const rowHeight = splitButton.menuOptionHeight;
    const buttonWidth = containerRect?.width ?? splitButton.buttonSize;
    const clip = getClipBounds();
    const clipTop = clip.top + 4;
    const clipBottom = clip.bottom - 4;
    const chartHeight = Math.max(rowHeight, clipBottom - clipTop);

    if (!containerRect) {
      return { top: clipTop, left: 0, maxHeight: Math.min(menuHeight, chartHeight) };
    }

    const left = containerRect.left + buttonWidth;
    const spaceBelow = clipBottom - containerRect.bottom;
    const spaceAbove = containerRect.top - clipTop;

    let top = containerRect.top;
    let maxHeight = menuHeight;

    if (menuHeight > spaceBelow && spaceAbove >= spaceBelow) {
      top = containerRect.bottom - menuHeight;
    }

    if (top + menuHeight > clipBottom) {
      top = clipBottom - menuHeight;
    }

    if (top < clipTop) {
      top = clipTop;
      maxHeight = chartHeight;
    } else {
      maxHeight = Math.min(menuHeight, clipBottom - top);
    }

    top = Math.max(clipTop, Math.min(top, clipBottom - maxHeight));

    if (maxHeight < menuHeight) {
      const visibleRows = Math.max(1, Math.floor(maxHeight / rowHeight));
      maxHeight = visibleRows * rowHeight + 2 * splitButton.menuPadding;
      maxHeight = Math.min(maxHeight, clipBottom - top);
    }

    return { top, left, maxHeight };
  }

  function calculateMenuHeight() {
    const optionsAmount = Object.keys(props.options).length;

    return optionsAmount * splitButton.menuOptionHeight + 2 * splitButton.menuPadding;
  }
};
