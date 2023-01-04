import * as React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

interface ListItemsWrapperProps {
  children?: JSX.Element|JSX.Element[]
  style?: React.CSSProperties
}

export const ListItemsWrapper = (props: ListItemsWrapperProps) => {

  return <Wrapper style={props.style}>
    {props.children}
  </Wrapper>;
};
