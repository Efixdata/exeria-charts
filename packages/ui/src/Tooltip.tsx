import * as React from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { UI_RADIUS } from "../designTokens";
import { UI_FONT_FAMILY } from "../theme";
import { isTooltipEnabled } from "./device";

const Wrap = styled.span`
  position: relative;
  display: inline-flex;
  max-width: 100%;
`;

const Bubble = styled.span<{ $top: number; $left: number; $placement: TooltipPlacement }>`
  position: fixed;
  z-index: 10002;
  pointer-events: none;
  white-space: nowrap;
  padding: 4px 8px;
  border-radius: var(--ui-radius-sm, ${UI_RADIUS.sm});
  background: rgba(18, 15, 41, 0.96);
  border: 1px solid rgba(127, 157, 204, 0.25);
  color: #e8edf7;
  font-family: ${UI_FONT_FAMILY};
  font-size: var(--ui-font-helper, 11px);
  line-height: 1.3;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
  left: ${(props) => props.$left}px;
  top: ${(props) => props.$top}px;
  transform: ${(props) =>
    props.$placement === "right" ? "translateY(-50%)" : "translateX(-50%)"};
`;

export type TooltipPlacement = "bottom" | "right";

interface TooltipProps {
  label?: string | undefined;
  placement?: TooltipPlacement | undefined;
  children: React.ReactElement;
}

export const Tooltip = (props: TooltipProps) => {
  const wrapRef = React.useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const label = props.label?.trim();
  const placement = props.placement ?? "bottom";

  const updatePosition = React.useCallback(() => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    if (placement === "right") {
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.right + 6,
      });
      return;
    }

    setPosition({
      top: rect.bottom + 6,
      left: rect.left + rect.width / 2,
    });
  }, [placement]);

  const show = () => {
    updatePosition();
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  if (!label || !isTooltipEnabled()) {
    return props.children;
  }

  const tooltipPortal =
    visible && typeof document !== "undefined"
      ? createPortal(
          <Bubble role="tooltip" $top={position.top} $left={position.left} $placement={placement}>
            {label}
          </Bubble>,
          document.body,
        )
      : null;

  return (
    <Wrap ref={wrapRef} onMouseEnter={show} onMouseLeave={hide}>
      {props.children}
      {tooltipPortal}
    </Wrap>
  );
};
