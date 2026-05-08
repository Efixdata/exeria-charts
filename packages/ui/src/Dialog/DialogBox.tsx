import * as React from "react";
import { DialogBody } from "./DialogBody";
import { DialogHeader } from "./DialogHeader";
import { DialogContainer } from "./DialogContainer";

interface DialogBoxProps {
  children?: JSX.Element | JSX.Element[] | string;
  style?: React.CSSProperties;
  onClose: () => void;
  title?: string;
}

export const DialogBox = (props: DialogBoxProps) => {
  return (
    <DialogContainer style={props.style}>
      <DialogHeader>{props.title}</DialogHeader>
      <DialogBody>{props.children}</DialogBody>
    </DialogContainer>
  );
};
