import * as React from "react";
import styled from "styled-components";

const Body = styled.div`
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: ${(props) => props.theme.scrollBar.thumbColor}
    ${(props) => props.theme.scrollBar.trackColor};

  &&::-webkit-scrollbar {
    width: 8px;
  }

  &&::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollBar.trackColor};
    border-radius: var(--ui-radius-md, 6px);
  }

  &&::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.scrollBar.thumbColor};
    border-radius: var(--ui-radius-md, 6px);
  }

  &&::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.scrollBar.thumbHoverColor};
  }
`;

interface DialogBodyProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
  id?: string;
  role?: React.AriaRole;
  "aria-labelledby"?: string;
}

export const DialogBody = (props: DialogBodyProps) => {
  return (
    <Body
      id={props.id}
      role={props.role}
      aria-labelledby={props["aria-labelledby"]}
      style={props.style}
    >
      {props.children}
    </Body>
  );
};
