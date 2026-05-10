import * as React from "react";
import { DialogBody } from "./DialogBody";
import { DialogHeader } from "./DialogHeader";
import { DialogContainer } from "./DialogContainer";

interface DialogBoxProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  onClose: () => void;
  title?: string | undefined;
}

export const DialogBox = (props: DialogBoxProps) => {
  return (
    <DialogContainer style={props.style}>
      <DialogHeader>{props.title}</DialogHeader>
      <DialogBody>{props.children}</DialogBody>
    </DialogContainer>
  );
};
