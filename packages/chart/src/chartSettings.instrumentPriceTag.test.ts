import { describe, expect, it } from "vitest";
import { setInstrumentSeriesLastPriceVisibility } from "./chartSettings";
import type { ChartRuntimeObject } from "./internal-types/objects";

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
          hGrid: true,
          vGrid: true,
          vMax: 100,
          vMin: 0,
          _visible: true,
          _width: 800,
          _height: 600,
          _offset: 0,
          main: true,
          objects: objects as ChartRuntimeObject[],
        },
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

    setInstrumentSeriesLastPriceVisibility(chart, {
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

    setInstrumentSeriesLastPriceVisibility(chart, { priceTag: false });

    for (const object of chart.model.panels[0]!.objects) {
      expect(object.priceTag).toBe(false);
    }
    expect(chart.model.panels[0]!.objects[0]!.priceLine).toBe(true);
    expect(chart.model.panels[0]!.objects[1]!.priceLine).toBe(false);
  });
});
