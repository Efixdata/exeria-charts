import * as React from "react";
import styled from "styled-components";
import { Label } from "ui";
import { inputBorderRadius } from "ui/theme";
import { inputFocusVisibleStyles } from "ui/inputStyles";

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return trimmed;
};

const FieldRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2, 8px);
  max-width: 100%;
`;

const ColorSwatch = styled.input.attrs({ type: "color" })`
  width: var(--ui-input-height, 36px);
  height: var(--ui-input-height, 36px);
  padding: var(--ui-space-1, 4px);
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  border-radius: ${inputBorderRadius};
  background: ${(props) => props.theme.inputs.backgroundColor};
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: calc(${inputBorderRadius} - 2px);
  }

  ${inputFocusVisibleStyles}
`;

const HexInput = styled.input`
  width: 10ch;
  max-width: 10ch;
  min-width: 0;
  flex: 0 0 auto;
  height: var(--ui-input-height, 36px);
  box-sizing: border-box;
  padding: 0 var(--ui-space-2, 8px);
  font-size: var(--ui-font-label, 12px);
  line-height: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  border-radius: ${inputBorderRadius};
  background: ${(props) => props.theme.inputs.backgroundColor};
  color: ${(props) => props.theme.inputs.textColor};
  outline: none;

  ${inputFocusVisibleStyles}
`;

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorField = (props: ColorFieldProps) => {
  const color = normalizeHexColor(props.value);

  return (
    <Label name={props.label}>
      <FieldRow>
        <ColorSwatch
          value={color}
          onChange={(event) => {
            props.onChange(event.target.value);
            event.currentTarget.blur();
          }}
          aria-label={`${props.label} color`}
        />
        <HexInput
          type="text"
          value={color}
          maxLength={10}
          onChange={(event) => props.onChange(event.target.value)}
          aria-label={`${props.label} hex value`}
        />
      </FieldRow>
    </Label>
  );
};
