import * as React from "react";
import { useEffect, useRef } from "react";
import styled from "styled-components";
import { inputBorderRadius } from "ui/theme";
import { inputFocusVisibleStyles } from "ui/inputStyles";
import { useStableId } from "../../../utils/useStableId";

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return trimmed;
};

const toColorInputValue = (value: string) => {
  const normalized = normalizeHexColor(value);
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized : "#000000";
};

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--ui-space-2, 8px);
  box-sizing: border-box;
  width: 100%;
`;

const FieldLabel = styled.span`
  color: ${(props) => props.theme.inputs.labelColor};
  font-size: var(--ui-font-label, 12px);
  font-weight: 500;
  line-height: 1.35;
`;

const FieldRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--ui-space-2, 8px);
  max-width: 100%;
`;

const SwatchWrap = styled.span`
  position: relative;
  flex-shrink: 0;
`;

const HiddenColorInput = styled.input.attrs({ type: "color" })`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
`;

const SwatchButton = styled.button<{ $color: string }>`
  display: block;
  width: var(--ui-input-height, 36px);
  height: var(--ui-input-height, 36px);
  padding: 0;
  border: ${(props) => props.theme.border?.inner || "1px solid transparent"};
  border-radius: ${inputBorderRadius};
  background-color: ${(props) => props.$color};
  cursor: pointer;
  box-sizing: border-box;

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
  const colorInputValue = toColorInputValue(props.value);
  const labelId = useStableId("color-field-label");
  const colorInputRef = useRef<HTMLInputElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);
  const isPickerOpenRef = useRef(false);

  useEffect(() => {
    const dismissPicker = (event: MouseEvent | TouchEvent) => {
      const colorInput = colorInputRef.current;
      if (!colorInput) {
        return;
      }

      const target = event.target as Node;
      if (swatchRef.current?.contains(target)) {
        return;
      }

      if (!isPickerOpenRef.current && document.activeElement !== colorInput) {
        return;
      }

      colorInput.blur();
      isPickerOpenRef.current = false;
    };

    document.addEventListener("mousedown", dismissPicker, true);
    document.addEventListener("touchstart", dismissPicker, true);

    return () => {
      document.removeEventListener("mousedown", dismissPicker, true);
      document.removeEventListener("touchstart", dismissPicker, true);
    };
  }, []);

  const openPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    isPickerOpenRef.current = true;
    colorInputRef.current?.click();
  };

  return (
    <FieldContainer role="group" aria-labelledby={labelId}>
      <FieldLabel id={labelId}>{props.label}</FieldLabel>
      <FieldRow>
        <SwatchWrap>
          <HiddenColorInput
            ref={colorInputRef}
            value={colorInputValue}
            tabIndex={-1}
            aria-hidden
            onFocus={() => {
              isPickerOpenRef.current = true;
            }}
            onBlur={() => {
              isPickerOpenRef.current = false;
            }}
            onChange={(event) => {
              props.onChange(event.target.value);
            }}
          />
          <SwatchButton
            ref={swatchRef}
            type="button"
            $color={colorInputValue}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={openPicker}
            aria-label={`${props.label} color`}
          />
        </SwatchWrap>
        <HexInput
          type="text"
          value={color}
          maxLength={10}
          onChange={(event) => props.onChange(event.target.value)}
          aria-labelledby={labelId}
          aria-label={`${props.label} hex value`}
        />
      </FieldRow>
    </FieldContainer>
  );
};
