import * as React from "react";
import { useEffect, useState } from "react";
import type { ValueAxisMode } from "@efixdata/exeria-chart";
import { SelectButton, TextButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";

interface ChartScaleSwitchProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

type ScaleModeId = "lin" | "log" | "perc";

const SCALE_MODES: ScaleModeId[] = ["lin", "log", "perc"];

const normalizeScaleMode = (mode: ValueAxisMode | undefined): ScaleModeId => {
  if (mode === "log") return "log";
  if (mode === "perc" || mode === "%") return "perc";
  return "lin";
};

const SCALE_SHORT: Record<ScaleModeId, string> = {
  lin: "Lin",
  log: "Log",
  perc: "%",
};

const SCALE_LABELS: Record<ScaleModeId, string> = {
  lin: "Linear scale",
  log: "Log scale",
  perc: "Percent scale",
};

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  const [selectedMode, setSelectedMode] = useState<ScaleModeId>(() =>
    normalizeScaleMode(props.chart?.getValueAxisMode()),
  );

  useEffect(() => {
    if (!props.chart) {
      return;
    }

    setSelectedMode(normalizeScaleMode(props.chart.getValueAxisMode()));
  }, [props.chart]);

  const getContext = (id: ScaleModeId) => (selectedMode === id ? "toolbar" : "subMenu");

  const getOptions = () => {
    const options: Record<
      ScaleModeId,
      {
        id: ScaleModeId;
        text: React.ReactElement;
        icon: React.ReactElement;
      }
    > = {} as Record<
      ScaleModeId,
      {
        id: ScaleModeId;
        text: React.ReactElement;
        icon: React.ReactElement;
      }
    >;

    for (const mode of SCALE_MODES) {
      const context = getContext(mode);

      options[mode] = {
        id: mode,
        text: <TextButton themeContext={context}>{SCALE_LABELS[mode]}</TextButton>,
        icon: <TextButton themeContext={context}>{SCALE_SHORT[mode]}</TextButton>,
      };
    }

    return options;
  };

  return (
    <SelectButton
      menuAlign="end"
      style={props.style}
      options={getOptions()}
      onSelect={(option) => {
        if (!option) return;
        const mode = option as ScaleModeId;
        props.chart?.setValueAxisMode(mode);
        setSelectedMode(mode);
      }}
      selectedOption={selectedMode}
    />
  );
};
