import * as React from "react";
import { useOnClick } from "./hooksHelper";
import styled from "styled-components";

export type ModalProps = {
  className?: string;
  visible: boolean;
  onClose?: () => void;
  onCloseOutsideClick?: boolean;
  children: React.ReactNode;
};

const { useEffect, useRef } = React;

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex !== -1 && !element.hasAttribute("disabled"),
  );
}

const Container = styled.div`
  position: fixed;
  z-index: 10000;
  inset: 0px;
`;

const BackDrop = styled.div`
  inset: 0;
  display: flex;
  backdrop-filter: blur(5px);
  z-index: -1;
  position: fixed;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  -webkit-tap-highlight-color: transparent;
  opacity: 1;
  transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
`;

const InnerContainer = styled.div`
  height: 100%;
  outline: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
`;

const InnerPaper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  transition: box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
`;

export const Modal = (props: ModalProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (props.visible) {
      document.body.classList.add("overFlowHidden");
    }
    return () => {
      document.body.classList.remove("overFlowHidden");
    };
  }, [props.visible]);

  useEffect(() => {
    if (!props.visible) {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const frame = window.requestAnimationFrame(() => {
      const container = ref.current;
      if (!container) {
        return;
      }

      const focusable = getFocusableElements(container);
      (focusable[0] ?? container).focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [props.visible]);

  useEffect(() => {
    if (!props.visible) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        props.onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const container = ref.current;
      if (!container) {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [props.onClose, props.visible]);

  useOnClick(ref, () => (props.onCloseOutsideClick && props.onClose ? props.onClose() : undefined));

  return props.visible ? (
    <Container role="presentation">
      <BackDrop aria-hidden="true"></BackDrop>
      <InnerContainer role="none presentation" tabIndex={-1}>
        <InnerPaper className={props.className} ref={ref} tabIndex={-1}>
          {props.children}
        </InnerPaper>
      </InnerContainer>
    </Container>
  ) : null;
};
