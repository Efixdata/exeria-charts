export interface ChartLegendSettings {
  mainInstrumentVisible: boolean;
  overlayInstrumentsVisible: boolean;
  indicatorsVisible: boolean;
}

export const DEFAULT_CHART_LEGEND_SETTINGS: ChartLegendSettings = {
  mainInstrumentVisible: true,
  overlayInstrumentsVisible: true,
  indicatorsVisible: true,
};

export type ChartLegendModel = {
  mainSeries: string;
  instrumentsSeries: Array<{ seriesId: string }>;
  legendVisibility?: Partial<ChartLegendSettings>;
};

export function resolveChartLegendSettings(model: ChartLegendModel): ChartLegendSettings {
  return {
    ...DEFAULT_CHART_LEGEND_SETTINGS,
    ...model.legendVisibility,
  };
}

function isInstrumentSeriesDataLink(model: ChartLegendModel, dataLink: string): boolean {
  return model.instrumentsSeries.some((entry) => entry.seriesId === dataLink);
}

export function isChartLegendVisibleForObject(
  object: { dataLink?: string; renderLegend?: boolean },
  model: ChartLegendModel,
  script: { id?: string | number } | null,
): boolean {
  if (object.renderLegend === false) {
    return false;
  }

  const dataLink = object.dataLink;
  if (!dataLink) {
    return false;
  }

  const settings = resolveChartLegendSettings(model);

  if (script?.id != null) {
    return settings.indicatorsVisible;
  }

  if (!isInstrumentSeriesDataLink(model, dataLink)) {
    return true;
  }

  if (dataLink === model.mainSeries) {
    return settings.mainInstrumentVisible;
  }

  return settings.overlayInstrumentsVisible;
}
