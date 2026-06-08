import * as React from "react";
import { Label } from "ui";
import { DialogSelect, type DialogSelectOption } from "./DialogSelect";
import { NumberInput } from "./NumberInput";
import { dialogSectionStyles } from "../../dialog/DialogSection";

export type ConditionalInputValue = {
  type: "double" | "series";
  value: string | number;
};

interface ConditionalInputProps {
  label: string;
  value: ConditionalInputValue;
  seriesOptions: DialogSelectOption[];
  onChange: (value: ConditionalInputValue) => void;
  min?: number;
  max?: number;
  step?: number;
  getModeLabel: (mode: "double" | "series") => string;
}

const normalizeConditionalValue = (
  value: ConditionalInputValue | null | undefined,
): ConditionalInputValue => {
  if (value && (value.type === "double" || value.type === "series")) {
    return {
      type: value.type,
      value: value.value ?? (value.type === "double" ? 0 : ""),
    };
  }

  return { type: "double", value: 0 };
};

export const ConditionalInput = ({
  label,
  value,
  seriesOptions,
  onChange,
  min,
  max,
  step,
  getModeLabel,
}: ConditionalInputProps) => {
  const normalizedValue = normalizeConditionalValue(value);

  const modeOptions: DialogSelectOption[] = [
    { value: "double", label: getModeLabel("double") },
    { value: "series", label: getModeLabel("series") },
  ];

  const onModeChange = (nextMode: string) => {
    if (nextMode !== "double" && nextMode !== "series") {
      return;
    }

    if (nextMode === "series") {
      onChange({
        type: "series",
        value: seriesOptions[0]?.value ?? "",
      });
      return;
    }

    onChange({
      type: "double",
      value:
        normalizedValue.type === "double" && normalizedValue.value !== ""
          ? normalizedValue.value
          : 0,
    });
  };

  return (
    <div className={dialogSectionStyles.fieldStack}>
      <Label name={label}>
        <DialogSelect
          value={normalizedValue.type}
          options={modeOptions}
          onChange={onModeChange}
          ariaLabel={`${label} mode`}
        />
      </Label>

      {normalizedValue.type === "series" ? (
        <Label name={getModeLabel("series")}>
          <DialogSelect
            value={
              normalizedValue.value !== null && normalizedValue.value !== undefined
                ? String(normalizedValue.value)
                : seriesOptions[0]?.value ?? ""
            }
            options={seriesOptions}
            onChange={(nextValue) => onChange({ type: "series", value: nextValue })}
            ariaLabel={`${label} series`}
          />
        </Label>
      ) : (
        <Label name={getModeLabel("double")}>
          <NumberInput
            allowEmpty={false}
            min={min}
            max={max}
            step={step}
            value={normalizedValue.value}
            placeholder={label}
            ariaLabel={`${label} value`}
            onChange={(nextValue) => onChange({ type: "double", value: nextValue })}
          />
        </Label>
      )}
    </div>
  );
};

export const isConditionalInputValid = (value: ConditionalInputValue | null | undefined) => {
  const normalized = normalizeConditionalValue(value);

  if (normalized.type === "double") {
    return normalized.value !== null && normalized.value !== undefined && normalized.value !== "";
  }

  return typeof normalized.value === "string" && normalized.value.length > 0;
};
