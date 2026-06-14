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

export function hideIndicatorLegends(chart: ChartInstance): void {
  const host = chart as ChartInstance & {
    model: {
      mainSeries: string;
      instrumentsSeries: Array<{ seriesId: string }>;
      panels: Array<{
        objects: Array<{
          dataLink?: string;
          renderLegend?: boolean;
        }>;
      }>;
    };
    fusion?: {
      getScriptsManager(): Record<string, { outputs?: Record<string, unknown> }>;
    };
  };

  const instrumentIds = new Set(
    host.model.instrumentsSeries.map((entry) => entry.seriesId),
  );
  const scriptOutputIds = new Set<string>();
  const scriptsManager = host.fusion?.getScriptsManager?.() ?? {};

  for (const script of Object.values(scriptsManager)) {
    for (const output of Object.values(script.outputs ?? {})) {
      if (typeof output === "string") {
        scriptOutputIds.add(output);
      }
    }
  }

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      const dataLink = object.dataLink;
      if (!dataLink) {
        continue;
      }

      if (instrumentIds.has(dataLink)) {
        delete object.renderLegend;
        continue;
      }

      if (scriptOutputIds.has(dataLink)) {
        object.renderLegend = false;
      }
    }
  }
}
