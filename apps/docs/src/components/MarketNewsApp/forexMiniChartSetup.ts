import type { ChartInstance } from "@exeria/charts";

type PanelObject = {
  type?: string;
  dataLink?: string;
  renderLegend?: boolean;
  priceTag?: boolean;
  priceLine?: boolean;
  hidden?: boolean;
};

type MiniChartHost = ChartInstance & {
  model: {
    mainSeries?: string;
    panels: Array<{ objects: PanelObject[] }>;
  };
};

/** Sidebar sparklines — line only, no strategy arrows or last-price tags. */
export function stripMarketNewsMiniChartDecorations(chart: ChartInstance): void {
  const host = chart as MiniChartHost;

  for (const panel of host.model.panels) {
    panel.objects = panel.objects.filter((object) => object.type !== "StrategyObject");

    for (const object of panel.objects) {
      object.renderLegend = false;
      if (object.type === "SeriesObject") {
        object.priceTag = false;
        object.priceLine = false;
      }
    }
  }

  const appearance = chart.getChartAppearanceSettings();
  chart.applyChartAppearanceSettings({
    ...appearance,
    lastPriceLineVisible: false,
    lastPriceLabelVisible: false,
  });
}
