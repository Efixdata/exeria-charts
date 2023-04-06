import * as React from "react";
import styled from "styled-components";

interface CheckboxInputProps {
  style?: React.CSSProperties
  onChange?: any;
  value?: boolean;
}

const Input = styled.input`
  
`

export const CheckboxInput = (props: CheckboxInputProps) => {
  if (props.value == true) {
    return <Input
      type={"checkbox"}
      onChange={props.onChange}
      checked
    />;
  } else {
    return <Input
      type={"checkbox"}
      onChange={props.onChange}
    />;
  }
  
};
