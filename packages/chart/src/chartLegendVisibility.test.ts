import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHART_LEGEND_SETTINGS,
  isChartLegendVisibleForObject,
  resolveChartLegendSettings,
} from "./chartLegendVisibility";

const model = {
  mainSeries: "EURUSD",
  instrumentsSeries: [{ seriesId: "EURUSD" }, { seriesId: "GBPUSD" }],
};

describe("chartLegendVisibility", () => {
  it("defaults all legend groups to visible", () => {
    expect(resolveChartLegendSettings(model)).toEqual(DEFAULT_CHART_LEGEND_SETTINGS);
  });

  it("hides main instrument legend when disabled", () => {
    const settings = {
      ...DEFAULT_CHART_LEGEND_SETTINGS,
      mainInstrumentVisible: false,
    };

    expect(
      isChartLegendVisibleForObject(
        { dataLink: "EURUSD" },
        { ...model, legendVisibility: settings },
        null,
      ),
    ).toBe(false);
  });

  it("hides overlay instrument legend when disabled", () => {
    const settings = {
      ...DEFAULT_CHART_LEGEND_SETTINGS,
      overlayInstrumentsVisible: false,
    };

    expect(
      isChartLegendVisibleForObject(
        { dataLink: "GBPUSD" },
        { ...model, legendVisibility: settings },
        null,
      ),
    ).toBe(false);
  });

  it("hides indicator legend when disabled", () => {
    const settings = {
      ...DEFAULT_CHART_LEGEND_SETTINGS,
      indicatorsVisible: false,
    };

    expect(
      isChartLegendVisibleForObject(
        { dataLink: "MACD_OUT" },
        { ...model, legendVisibility: settings },
        { id: "macd-1" },
      ),
    ).toBe(false);
  });

  it("respects per-object renderLegend opt-out", () => {
    expect(
      isChartLegendVisibleForObject(
        { dataLink: "EURUSD", renderLegend: false },
        model,
        null,
      ),
    ).toBe(false);
  });
});
