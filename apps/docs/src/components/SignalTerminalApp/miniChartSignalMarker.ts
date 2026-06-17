import type { ChartInstance } from "@efixdata/exeria-chart";
import type { SignalSide } from "./signalCatalog";

const FUSION_BUY = 1;
const FUSION_SELL = -1;

type StrategyPlotter = {
  type?: string;
  dataLink?: string;
  dataField?: string;
  hidden?: boolean;
};

type MarkerChartHost = ChartInstance & {
  model: {
    panels: Array<{
      objects: StrategyPlotter[];
    }>;
  };
};

function findCrossStrategyPlotter(chart: ChartInstance): StrategyPlotter | null {
  const host = chart as MarkerChartHost;

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      if (object.type === "StrategyObject" && object.dataField === "CrossValue" && object.dataLink) {
        return object;
      }
    }
  }

  return null;
}

/** Ensures a Buy/Sell triangle is rendered at the screener signal bar. */
export function applyMiniChartSignalMarker(
  chart: ChartInstance,
  barIndex: number,
  side: SignalSide,
): void {
  const plotter = findCrossStrategyPlotter(chart);
  if (!plotter?.dataLink) {
    return;
  }

  const series = chart.getSeriesManager()[plotter.dataLink];
  const field = plotter.dataField ?? "CrossValue";
  const point = series?.data?.[barIndex] as Record<string, unknown> | undefined;

  if (!point) {
    return;
  }

  point[field] = side === "buy" ? FUSION_BUY : FUSION_SELL;
  plotter.hidden = false;
}
