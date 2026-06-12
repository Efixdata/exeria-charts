import type { ChartInstance, ScriptDefinition } from "@exeria/charts";

export function cloneScript(script: ScriptDefinition): ScriptDefinition {
  return JSON.parse(JSON.stringify(script)) as ScriptDefinition;
}

export function getScriptClone(chart: ChartInstance, key: string): ScriptDefinition {
  const script = chart.getScripts()[key];
  if (!script) {
    throw new Error(`Missing script definition for ${key}`);
  }
  return cloneScript(script);
}

export function getSeriesReference(chart: ChartInstance, field: string): string {
  const series = Object.values(chart.getSeriesManager()).find(
    (candidate) => candidate.seriesId && candidate.fields.includes(field),
  );

  if (!series?.seriesId) {
    throw new Error(`Series field ${field} not found`);
  }

  return `${series.seriesId}:${field}`;
}

export function hideScriptLegends(chart: ChartInstance): void {
  const host = chart as ChartInstance & {
    model: {
      panels: Array<{
        objects: Array<{ renderLegend?: boolean }>;
      }>;
    };
  };

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      object.renderLegend = false;
    }
  }
}
