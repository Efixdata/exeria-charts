import * as React from "react";
import { useCallback, useEffect, useState } from "react";
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

type ChartWithInstrumentDrawMode = NullableChartInstance & {
  getInstrumentDrawMode?: (seriesId?: string) => DrawMode;
  setInstrumentDrawMode?: (mode: DrawMode, seriesId?: string) => void;
  getSelectedInstrumentSeriesId?: () => string;
  subscribe?: (
    topic: string,
    callback: (data: { seriesId?: string; drawMode?: DrawMode }) => void,
  ) => { unsubscribe?: () => void } | void;
};

function unsubscribeChartTopic(subscription: { unsubscribe?: () => void } | void | undefined) {
  if (subscription && typeof subscription.unsubscribe === "function") {
    subscription.unsubscribe();
  }
}

export const MainChartTypeSelect = (props: MainChartTypeSelectProps) => {
  const chart = props.chart as ChartWithInstrumentDrawMode;
  const t = useChartTranslate(chart);
  const defaultDrawMode: DrawMode = "OHLC";
  const [selectedDrawMode, setSelectedDrawMode] = useState<DrawMode>(defaultDrawMode);

  const syncDrawMode = useCallback(() => {
    const mode = chart?.getInstrumentDrawMode?.();
    if (mode) {
      setSelectedDrawMode(mode);
    }
  }, [chart]);

  useEffect(() => {
    syncDrawMode();
  }, [syncDrawMode]);

  useEffect(() => {
    if (!chart?.subscribe) {
      return undefined;
    }

    const selectedSubscription = chart.subscribe("SELECTED_INSTRUMENT_CHANGE", () => {
      syncDrawMode();
    });
    const drawModeSubscription = chart.subscribe(
      "INSTRUMENT_DRAW_MODE_CHANGE",
      (data: { seriesId?: string; drawMode?: DrawMode }) => {
        if (!data.drawMode) {
          return;
        }

        const selectedSeriesId = chart.getSelectedInstrumentSeriesId?.();
        if (!selectedSeriesId || data.seriesId === selectedSeriesId) {
          setSelectedDrawMode(data.drawMode);
        }
      },
    );

    return () => {
      unsubscribeChartTopic(selectedSubscription);
      unsubscribeChartTopic(drawModeSubscription);
    };
  }, [chart, syncDrawMode]);

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
        chart?.setInstrumentDrawMode?.(option as DrawMode);
        setSelectedDrawMode(option as DrawMode);
      }}
      selectedOption={selectedDrawMode}
    />
  );
};
