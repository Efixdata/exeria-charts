import type { ChartInstance } from "@exeria/charts";

type MutableChartModel = Record<string, unknown> & {
  panels: unknown[];
  scripts: unknown[];
};

/**
 * Chart constructor shallow-copies the default model — panels/scripts are shared
 * across instances. Clone before init() so each mini chart owns its own state.
 */
export function isolateMiniChartModel(chart: ChartInstance): void {
  const host = chart as ChartInstance & { model: MutableChartModel };
  const cloned = JSON.parse(JSON.stringify(host.model)) as MutableChartModel;
  cloned.scripts = [];
  host.model = cloned;
}
