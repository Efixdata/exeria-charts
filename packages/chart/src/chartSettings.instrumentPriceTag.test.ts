import { describe, expect, it } from "vitest";
import { setInstrumentSeriesLastPriceVisibility } from "./chartSettings";
import type { ChartRuntimeObject } from "./internal-types/objects";

import type { CoreChartPanel } from "./internal-types/chart";

type MockPlotter = ChartRuntimeObject & {
  priceTag?: boolean;
  priceLine?: boolean;
};

function createInstrumentChart(plotters: Array<{ seriesId: string; priceTag?: boolean; priceLine?: boolean }>) {
  const objects: MockPlotter[] = plotters.map((plotter) => ({
    id: plotter.seriesId,
    type: "SeriesObject",
    dataLink: plotter.seriesId,
    priceTag: plotter.priceTag,
    priceLine: plotter.priceLine,
  }));

  return {
    model: {
      mainSeries: plotters[0]?.seriesId ?? "",
      instrumentsSeries: plotters.map((plotter) => ({ seriesId: plotter.seriesId })),
      panels: [
        {
          id: "main",
          basis: 100,
          valueAxisMode: "auto",
          vMax: 0,
          vMin: 0,
          fV: 1,
          digits: 4,
          locked: false,
          main: true,
          hGrid: true,
          vGrid: true,
          objects,
        } as unknown as CoreChartPanel,
      ],
      scripts: [],
    },
    renderer: { objects: {} },
    translate: (text: string) => text,
    getScripts: () => ({}),
    rerender: () => {},
    objectsManager: { detachScript: () => {} },
    onDelete: () => {},
  };
}

describe("setInstrumentSeriesLastPriceVisibility", () => {
  it("updates last price label and line on every instrument series", () => {
    const chart = createInstrumentChart([
      { seriesId: "EURUSD", priceTag: true, priceLine: true },
      { seriesId: "GBPUSD", priceTag: true, priceLine: true },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setInstrumentSeriesLastPriceVisibility(chart as any, {
      priceTag: false,
      priceLine: false,
    });

    for (const object of chart.model.panels[0]!.objects) {
      expect(object.priceTag).toBe(false);
      expect(object.priceLine).toBe(false);
    }
  });

  it("can update only the last price label", () => {
    const chart = createInstrumentChart([
      { seriesId: "EURUSD", priceTag: true, priceLine: true },
      { seriesId: "GBPUSD", priceTag: true, priceLine: false },
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setInstrumentSeriesLastPriceVisibility(chart as any, { priceTag: false });

    for (const object of chart.model.panels[0]!.objects) {
      expect(object.priceTag).toBe(false);
    }
    expect(chart.model.panels[0]!.objects[0]!.priceLine).toBe(true);
    expect(chart.model.panels[0]!.objects[1]!.priceLine).toBe(false);
  });
});
