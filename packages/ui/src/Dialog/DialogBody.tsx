import * as React from "react";
import styled from "styled-components";

const Body = styled.div`
  overflow-y: auto;

  /* width */
  &&::-webkit-scrollbar {
    width: 12px;
  }

  /* Track */
  &&::-webkit-scrollbar-track {
    background: ${(props) => props.theme.scrollBar.trackColor};
    border-radius: 6px;
  }

  /* Handle */
  &&::-webkit-scrollbar-thumb {
    background: ${(props) => props.theme.scrollBar.thumbColor};
    border-radius: 6px;
  }

  /* Handle on hover */
  &&::-webkit-scrollbar-thumb:hover {
    background: ${(props) => props.theme.scrollBar.thumbHoverColor};
  }
`;

interface DialogBodyProps {
  children?: React.ReactNode;
  style?: React.CSSProperties | undefined;
}

export const DialogBody = (props: DialogBodyProps) => {
  return <Body style={props.style}>{props.children}</Body>;
};
