import * as React from "react";
import styled from "styled-components";

const Header = styled.div`
    padding: 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: #7F9DCC;
    font-size: 14px;
`

interface DialogHeaderProps {
  children?: JSX.Element|JSX.Element[]|string;
}

export const DialogHeader = (props: DialogHeaderProps) => {
  return (
        <Header>{props.children}</Header>
  );
};
