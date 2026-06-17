import * as React from "react";
import {
  PLOTTER_LINE_STYLES,
  type PlotterLineStyle,
} from "../../../utils/plotterLineStyles";
import { DialogSelect } from "./DialogSelect";

const LinePreview = ({
  dash,
  color,
  width = 56,
}: {
  dash: number[];
  color: string;
  width?: number;
}) => (
  <svg width={width} height={14} aria-hidden style={{ flexShrink: 0 }}>
    <line
      x1="1"
      y1="7"
      x2={width - 1}
      y2="7"
      stroke={color}
      strokeWidth="2"
      strokeDasharray={dash.length > 0 ? dash.join(" ") : undefined}
    />
  </svg>
);

interface LineStyleSelectProps {
  value: string;
  lineColor: string;
  onChange: (styleId: string) => void;
  getOptionLabel: (style: PlotterLineStyle) => string;
  ariaLabel: string;
}

export const LineStyleSelect = ({
  value,
  lineColor,
  onChange,
  getOptionLabel,
  ariaLabel,
}: LineStyleSelectProps) => {
  const options = PLOTTER_LINE_STYLES.map((style) => ({
    value: style.id,
    label: getOptionLabel(style),
    dash: style.dash,
  }));

  const selectedStyle = PLOTTER_LINE_STYLES.find((style) => style.id === value) ?? PLOTTER_LINE_STYLES[0];

  return (
    <DialogSelect
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={ariaLabel}
      renderTriggerPrefix={() => (
        <LinePreview dash={selectedStyle.dash} color={lineColor} width={48} />
      )}
      renderOptionPrefix={(option) => {
        const style = PLOTTER_LINE_STYLES.find((entry) => entry.id === option.value);
        if (!style) {
          return null;
        }

        return <LinePreview dash={style.dash} color={lineColor} />;
      }}
    />
  );
};
