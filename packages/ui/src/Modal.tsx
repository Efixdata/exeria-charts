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

const { useEffect, useRef } = React

const Container = styled.div`
    position: fixed;
    z-index: 1300;
    inset: 0px;
`;
  
const BackDrop = styled.div`
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
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
  const ref: any = useRef();

  useEffect(() => {
    if (props.visible) {
      document.body.classList.add("overFlowHidden");
    }
    return () => {
      document.body.classList.remove("overFlowHidden");
    };
  }, [props.visible]);

  useOnClick(ref, () =>
    props.onCloseOutsideClick && props.onClose ? props.onClose() : undefined
  );

  return props.visible ? (
    <Container role="presentation">
      <BackDrop aria-hidden="true"></BackDrop>
      <InnerContainer role="none presentation" tabIndex={-1}>
        <InnerPaper className={props.className} ref={ref}>
          {props.children}
        </InnerPaper>
      </InnerContainer>
    </Container>
  ) : null;
};