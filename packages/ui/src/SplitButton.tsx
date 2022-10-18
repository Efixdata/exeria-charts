import * as React from "react";
import styled from "styled-components";
import { textButton } from "../theme"; 
import { IconButton } from "./IconButton";

import ChevronDown from "../img/icons/chevron_down.jsx";

const Container = styled.div`
  box-sizing: border-box;
  display: flex;
`
const Chevron = styled.div`

`

interface SplitButtonProps {
  button?: React.ReactNode
}

export const SplitButton = (props: SplitButtonProps) => {

  return (
    <Container>
      {props.button}
      <Chevron>
        <ChevronDown />
      </Chevron>
    </Container>
  );
};
