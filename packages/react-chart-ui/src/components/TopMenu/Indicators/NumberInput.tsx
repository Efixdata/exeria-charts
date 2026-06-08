import * as React from "react";
import { useMemo } from "react";
import styled from "styled-components";
import { CaretDown, CaretUp } from "phosphor-react";
import { inputErrorBorder, inputBorderRadius } from "ui/theme";
import { inputFocusWithinStyles, menuOptionFocusVisibleStyles } from "ui/inputStyles";

const Field = styled.div<{ $invalid?: boolean }>`
  display: flex;
  align-items: stretch;
  width: 100%;
  height: var(--ui-input-height, 36px);
  border-radius: ${inputBorderRadius};
  background-color: ${(props) => props.theme.inputs.backgroundColor};
  overflow: hidden;
  box-sizing: border-box;
  border: ${(props) => (props.$invalid ? inputErrorBorder : props.theme.border?.inner || "1px solid transparent")};

  ${inputFocusWithinStyles}
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: ${(props) => props.theme.inputs.textColor};
  font-size: var(--ui-font-body, 13px);
  font-family: inherit;
  padding: 0 8px 0 14px;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &::placeholder {
    color: ${(props) => props.theme.inputs.placeholderColor};
  }
`;

const Stepper = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 34px;
  border-left: ${(props) => props.theme.border?.inner || "1px solid rgba(255, 255, 255, 0.1)"};
`;

const StepButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 0;
  padding: 0;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.inputs.textColor};
  background: transparent;

  &:hover:not(:disabled) {
    color: ${(props) => props.theme.buttons?.hoverColor || props.theme.inputs.textColor};
    background: ${(props) => props.theme.buttons?.hoverBackground || "rgba(255, 255, 255, 0.08)"};
  }

  &:active:not(:disabled) {
    color: ${(props) => props.theme.buttons?.activeColor || props.theme.accentColor};
    background: ${(props) => props.theme.buttons?.activeBackground || "transparent"};
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  ${menuOptionFocusVisibleStyles}
`;

const parseNumericValue = (value: string | number, integer: boolean): number | null => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = integer ? parseInt(String(value), 10) : parseFloat(String(value));
  return Number.isNaN(parsed) ? null : parsed;
};

const clampValue = (value: number, min?: number, max?: number) => {
  let next = value;

  if (typeof min === "number") {
    next = Math.max(min, next);
  }

  if (typeof max === "number") {
    next = Math.min(max, next);
  }

  return next;
};

const formatValue = (value: number, integer: boolean, step?: number) => {
  if (integer) {
    return String(Math.round(value));
  }

  if (typeof step === "number" && step > 0 && step < 1) {
    const decimals = String(step).includes(".") ? String(step).split(".")[1]?.length ?? 2 : 2;
    return value.toFixed(decimals);
  }

  return String(value);
};

export interface NumberInputProps {
  value?: string | number | null;
  onChange: (value: string | number) => void;
  min?: number;
  max?: number;
  step?: number;
  integer?: boolean;
  allowEmpty?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

export const NumberInput = ({
  value,
  onChange,
  min,
  max,
  step,
  integer = false,
  allowEmpty = true,
  placeholder,
  ariaLabel,
}: NumberInputProps) => {
  const resolvedStep = step ?? (integer ? 1 : 0.01);
  const parsedValue = parseNumericValue(value ?? "", integer);
  const isInvalid =
    allowEmpty === false && (value === null || value === undefined || value === "");

  const canIncrease = useMemo(() => {
    if (parsedValue === null) {
      return true;
    }

    return typeof max !== "number" || parsedValue < max;
  }, [max, parsedValue]);

  const canDecrease = useMemo(() => {
    if (parsedValue === null) {
      return true;
    }

    return typeof min !== "number" || parsedValue > min;
  }, [min, parsedValue]);

  const emitValue = (nextValue: number) => {
    const clamped = clampValue(nextValue, min, max);
    onChange(formatValue(clamped, integer, resolvedStep));
  };

  const handleStep = (direction: 1 | -1) => {
    const baseValue = parsedValue ?? (typeof min === "number" ? min : 0);
    emitValue(baseValue + direction * resolvedStep);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextRaw = event.target.value;

    if (nextRaw === "") {
      onChange("");
      return;
    }

    if (integer && !/^-?\d*$/.test(nextRaw)) {
      return;
    }

    if (!integer && !/^-?\d*\.?\d*$/.test(nextRaw)) {
      return;
    }

    onChange(nextRaw);
  };

  const handleBlur = () => {
    if (parsedValue === null) {
      return;
    }

    emitValue(parsedValue);
  };

  return (
    <Field $invalid={isInvalid}>
      <Input
        type="text"
        inputMode={integer ? "numeric" : "decimal"}
        value={value ?? ""}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onChange={handleInputChange}
        onBlur={handleBlur}
      />
      <Stepper>
        <StepButton
          type="button"
          aria-label={ariaLabel ? `${ariaLabel} increase` : "Increase value"}
          disabled={!canIncrease}
          onClick={() => handleStep(1)}
        >
          <CaretUp size={14} weight="bold" />
        </StepButton>
        <StepButton
          type="button"
          aria-label={ariaLabel ? `${ariaLabel} decrease` : "Decrease value"}
          disabled={!canDecrease}
          onClick={() => handleStep(-1)}
        >
          <CaretDown size={14} weight="bold" />
        </StepButton>
      </Stepper>
    </Field>
  );
};
