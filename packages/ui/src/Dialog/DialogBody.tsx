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
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
    }

    /* Handle */
    &&::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 6px;
    }

    /* Handle on hover */
    &&::-webkit-scrollbar-thumb:hover {
      background: #7F9DCC;
    }
`

interface DialogBodyProps {
  children?: JSX.Element|JSX.Element[]|string;
  style?: React.CSSProperties;
}

export const DialogBody = (props: DialogBodyProps) => {
  return (
        <Body style={props.style}>
            {props.children}
        </Body>
  );
};
