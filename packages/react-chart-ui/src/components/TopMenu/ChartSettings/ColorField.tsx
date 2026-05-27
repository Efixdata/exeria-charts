import * as React from "react";
import { Label } from "ui";

const normalizeHexColor = (value: string) => {
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed.toUpperCase();
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) return `#${trimmed.toUpperCase()}`;
  return trimmed;
};

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorField = (props: ColorFieldProps) => {
  const color = normalizeHexColor(props.value);

  return (
    <Label name={props.label} style={{ width: "auto", maxWidth: "100%" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          maxWidth: "100%",
        }}
      >
        <input
          type="color"
          value={color}
          onChange={(event) => props.onChange(event.target.value)}
          aria-label={`${props.label} color`}
          style={{
            width: 32,
            height: 32,
            padding: 0,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={color}
          maxLength={10}
          onChange={(event) => props.onChange(event.target.value)}
          aria-label={`${props.label} hex value`}
          style={{
            width: "10ch",
            maxWidth: "10ch",
            minWidth: 0,
            flex: "0 0 auto",
            height: 32,
            boxSizing: "border-box",
            padding: "0 8px",
            fontSize: 12,
            lineHeight: "32px",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: 4,
            background: "rgba(0, 0, 0, 0.18)",
            color: "inherit",
            outline: "none",
          }}
        />
      </div>
    </Label>
  );
};
