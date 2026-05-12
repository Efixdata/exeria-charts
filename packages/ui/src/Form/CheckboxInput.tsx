import * as React from "react";
import styled from "styled-components";
import { inputBackgroundColor, checkboxBorderRadius } from "ui/theme";
import { Check } from "@phosphor-icons/react";

interface CheckboxInputProps {
  style?: React.CSSProperties | undefined;
  onChange?: any;
  value?: boolean | undefined;
}

const Input = styled.input`
  background-color: ${inputBackgroundColor};
  -webkit-appearance: none;
  -moz-appearance: none;
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: ${checkboxBorderRadius};
  margin: 8px 0;
  padding: 0;
  }
`;

export const CheckboxInput = (props: CheckboxInputProps) => {
  if (props.value == true) {
    return (
      <div style={{ position: "relative", width: "38px", height: "38px" }}>
        <Input
          style={{ position: "absolute" }}
          type={"checkbox"}
          onChange={props.onChange}
          checked
        ></Input>
        <Check
          size={28}
          weight="bold"
          style={{ position: "absolute", right: "12px", bottom: "8px" }}
        />
      </div>
    );
  } else {
    return <Input type={"checkbox"} onChange={props.onChange} />;
  }
};
