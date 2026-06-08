import * as React from "react";
import { useState } from "react";
import type { DrawMode } from "@efixdata/exeria-chart";
import {
  ChartHistogram,
  ChartLine,
  ChartBars,
  ChartCandles,
  ChartHistogramLine,
} from "../../img/icons/chartTypes/index.js";
import { SelectButton, TextButton, IconButton } from "ui";
import type { NullableChartInstance } from "../../chartTypes";
import { useChartTranslate } from "../../hooks/useChartTranslate";

interface MainChartTypeSelectProps {
  chart: NullableChartInstance;
  style?: React.CSSProperties;
}

export const MainChartTypeSelect = (props: MainChartTypeSelectProps) => {
  const t = useChartTranslate(props.chart);
  const defaultDrawMode: DrawMode = "OHLC";
  const [selectedDrawMode, setSelectedDrawMode] = useState<DrawMode>(defaultDrawMode);

  function getOptions() {
    const options = {
      OHLC: {
        id: "OHLC",
        text: (
          <TextButton tabIndex={-1} themeContext={getContext("OHLC")}>
            {t("chart_type_candles", "Candles")}
          </TextButton>
        ),
        icon: (
          <IconButton tabIndex={-1} themeContext={getContext("OHLC")}>
            <ChartCandles />
          </IconButton>
        ),
      },
      Bars: {
        id: "Bars",
        text: (
          <TextButton tabIndex={-1} themeContext={getContext("Bars")}>{t("chart_type_bars", "Bars")}</TextButton>
        ),
        icon: (
          <IconButton tabIndex={-1} themeContext={getContext("Bars")}>
            <ChartBars />
          </IconButton>
        ),
      },
      Line: {
        id: "Line",
        text: (
          <TextButton tabIndex={-1} themeContext={getContext("Line")}>{t("chart_type_line", "Line")}</TextButton>
        ),
        icon: (
          <IconButton tabIndex={-1} themeContext={getContext("Line")}>
            <ChartLine />
          </IconButton>
        ),
      },
      Histogram: {
        id: "Histogram",
        text: (
          <TextButton tabIndex={-1} themeContext={getContext("Histogram")}>
            {t("chart_type_histogram", "Histogram")}
          </TextButton>
        ),
        icon: (
          <IconButton tabIndex={-1} themeContext={getContext("Histogram")}>
            <ChartHistogram />
          </IconButton>
        ),
      },
      ["Line and Histogram"]: {
        id: "Line and Histogram",
        text: (
          <TextButton tabIndex={-1} themeContext={getContext("Line and Histogram")}>
            {t("chart_type_line_histogram", "Line and histogram")}
          </TextButton>
        ),
        icon: (
          <IconButton tabIndex={-1} themeContext={getContext("Line and Histogram")}>
            <ChartHistogramLine />
          </IconButton>
        ),
      },
    };

    function getContext(id: string) {
      return selectedDrawMode === id ? "toolbar" : "subMenu";
    }

    return options;
  }

  return (
    <SelectButton
      ariaLabel={t("toolbar_chart_type", "Chart type")}
      options={getOptions()}
      onSelect={(option) => {
        if (!option) return;
        props.chart?.setMainDrawMode(option as DrawMode);
        setSelectedDrawMode(option as DrawMode);
      }}
      selectedOption={selectedDrawMode}
    />
  );
};
