import * as React from "react";
import { useEffect, useState } from "react";
import type { ValueAxisMode } from "@efixdata/exeria-chart";
import { SelectButton, TextButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

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

const SCALE_LABEL_KEYS: Record<ScaleModeId, string> = {
  lin: "scale_linear",
  log: "scale_log",
  perc: "scale_percent",
};

export const ChartScaleSwitch = (props: ChartScaleSwitchProps) => {
  const t = useChartTranslate(props.chart);
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
      const labelKey = SCALE_LABEL_KEYS[mode];
      const fallback =
        mode === "lin" ? "Linear scale" : mode === "log" ? "Log scale" : "Percent scale";

      options[mode] = {
        id: mode,
        text: <TextButton tabIndex={-1} themeContext={context}>{t(labelKey, fallback)}</TextButton>,
        icon: <TextButton tabIndex={-1} themeContext={context}>{SCALE_SHORT[mode]}</TextButton>,
      };
    }

    return options;
  };

  return (
    <SelectButton
      ariaLabel={t("toolbar_price_scale", "Price scale")}
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
