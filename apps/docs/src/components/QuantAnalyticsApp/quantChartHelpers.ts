import type { ChartInstance, ScriptDefinition } from "@efixdata/exeria-chart";

type QuantChartModel = {
  scripts: Array<{
    id?: string | number;
    key?: string;
    pane?: string;
    outputs?: Record<string, string>;
  }>;
  mainSeries: string;
  panels: Array<{
    main?: boolean;
    basis?: number;
    _visible?: boolean;
  }>;
};

type QuantChartRuntime = ChartInstance & {
  model: QuantChartModel;
  syncChartLayoutAndRepaint?: () => void;
};

export async function addQuantScript(
  chart: ChartInstance,
  key: string,
  proto?: ScriptDefinition,
): Promise<string | number> {
  await chart.addScript(key, proto);
  return getLastScriptId(chart, key);
}

export function getLastScriptId(chart: ChartInstance, key: string): string | number {
  const scripts = (chart as QuantChartRuntime).model.scripts.filter((entry) => entry.key === key);
  const last = scripts[scripts.length - 1];

  if (!last?.id) {
    throw new Error(`Missing script instance for ${key}`);
  }

  return last.id;
}

export function getScriptPaneId(chart: ChartInstance, scriptId: string | number): string {
  const script = (chart as QuantChartRuntime).model.scripts.find((entry) => entry.id === scriptId);

  if (!script?.pane) {
    throw new Error(`Missing pane for script ${scriptId}`);
  }

  return String(script.pane);
}

export function getScriptSeriesReference(
  chart: ChartInstance,
  scriptId: string | number,
  field: string,
): string {
  const script = (chart as QuantChartRuntime).model.scripts.find((entry) => entry.id === scriptId);

  if (!script?.outputs) {
    throw new Error(`Missing outputs for script ${scriptId}`);
  }

  const seriesManager = chart.getSeriesManager();

  for (const seriesId of Object.values(script.outputs)) {
    const series = seriesManager[seriesId];
    if (series?.fields?.includes(field)) {
      return `${seriesId}:${field}`;
    }
  }

  throw new Error(`Field ${field} not found for script ${scriptId}`);
}

export function applyQuantCompositePanelLayout(chart: ChartInstance): void {
  const runtime = chart as QuantChartRuntime;
  const visiblePanels = runtime.model.panels.filter((panel) => panel._visible !== false);

  if (visiblePanels.length === 0) {
    return;
  }

  const lastIndex = visiblePanels.length - 1;

  visiblePanels.forEach((panel, index) => {
    if (panel.main) {
      panel.basis = 50;
      return;
    }

    if (index === lastIndex) {
      panel.basis = 33;
      return;
    }

    panel.basis = 8;
  });

  runtime.syncChartLayoutAndRepaint?.();
}
