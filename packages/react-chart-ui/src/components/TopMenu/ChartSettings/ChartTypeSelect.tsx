import * as React from "react";
import type { DrawMode } from "@efixdata/exeria-chart";
import { DialogSelect } from "../Indicators/DialogSelect";
import { CHART_DRAW_MODE_OPTIONS } from "../../../utils/chartDrawModes";

const ChartTypePreview = ({ drawMode }: { drawMode: DrawMode }) => {
  const option = CHART_DRAW_MODE_OPTIONS.find((entry) => entry.id === drawMode);
  if (!option) {
    return null;
  }

  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 24,
        height: 24,
        flexShrink: 0,
      }}
    >
      {option.renderIcon()}
    </span>
  );
};

interface ChartTypeSelectProps {
  value: DrawMode;
  onChange: (drawMode: DrawMode) => void;
  getOptionLabel: (drawMode: DrawMode) => string;
  ariaLabel: string;
}

export const ChartTypeSelect = ({
  value,
  onChange,
  getOptionLabel,
  ariaLabel,
}: ChartTypeSelectProps) => {
  const options = CHART_DRAW_MODE_OPTIONS.map((option) => ({
    value: option.id,
    label: getOptionLabel(option.id),
  }));

  return (
    <DialogSelect
      value={value}
      options={options}
      onChange={(nextValue) => onChange(nextValue as DrawMode)}
      ariaLabel={ariaLabel}
      renderTriggerPrefix={() => <ChartTypePreview drawMode={value} />}
      renderOptionPrefix={(option) => (
        <ChartTypePreview drawMode={option.value as DrawMode} />
      )}
    />
  );
};
