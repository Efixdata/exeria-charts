import type { ChartInstance } from "@exeria/charts";
import { pruneEmptyPanels } from "../CryptoTerminalApp/chartScene";
import { reapplyMiniChartMarker } from "./miniChartMarkerState";
import { fitMiniChartAutoViewport } from "./miniChartSignalTagViewport";
import { isMiniChartViewportUserAdjusted } from "./miniChartViewportState";
import { configureMiniChartScriptVisibility } from "./miniChartScriptVisibility";

type ChartPanelObject = {
  type?: string;
  renderLegend?: boolean;
  priceTag?: boolean;
  priceLine?: boolean;
  dataLink?: string;
  hidden?: boolean;
};

type MiniChartModel = {
  timeAxisHeight: number;
  valueAxisWidth: number;
  endMargin: number;
  minTimeTickWidth: number;
  minValueTickHeight: number;
  _priceAxisExpanded?: boolean;
  panels: Array<{
    main?: boolean;
    hGrid?: boolean;
    vGrid?: boolean;
    objects: ChartPanelObject[];
  }>;
};

type MiniChartHost = ChartInstance & {
  model: MiniChartModel & {
    mainSeries?: string;
  };
};

type MiniChartPanelObject = ChartPanelObject & {
  dataLink?: string;
  hidden?: boolean;
};

function hideVolume(chart: ChartInstance): void {
  const volume = chart.getChartVolumeSettings();
  if (volume.available) {
    chart.applyChartVolumeSettings({ ...volume, visible: false });
    if (volume.scriptId != null) {
      chart.setChartIndicatorVisibility(volume.scriptId, false);
    }
  }
}

/** Strategy arrows anchor Y to the first SeriesObject on the main panel — keep main price series first. */
export function ensureMiniChartStrategyLayout(chart: ChartInstance): void {
  const host = chart as MiniChartHost;
  const mainLink = host.model.mainSeries;

  for (const panel of host.model.panels) {
    if (!panel.main) {
      continue;
    }

    const mainSeriesObjects: MiniChartPanelObject[] = [];
    const strategies: MiniChartPanelObject[] = [];
    const others: MiniChartPanelObject[] = [];

    for (const object of panel.objects as MiniChartPanelObject[]) {
      if (object.type === "StrategyObject") {
        object.hidden = false;
        strategies.push(object);
        continue;
      }

      if (object.type === "SeriesObject" && mainLink && object.dataLink === mainLink) {
        mainSeriesObjects.push(object);
        continue;
      }

      others.push(object);
    }

    panel.objects = [...mainSeriesObjects, ...others, ...strategies];
  }
}

function isMainPriceSeries(host: MiniChartHost, panel: MiniChartModel["panels"][number], object: ChartPanelObject): boolean {
  return (
    panel.main === true &&
    object.type === "SeriesObject" &&
    Boolean(host.model.mainSeries && object.dataLink === host.model.mainSeries)
  );
}

function applyMiniChartLayoutOverrides(host: MiniChartHost): void {
  host.model.timeAxisHeight = 0;
  host.model.endMargin = 4;
  host.model.minTimeTickWidth = 9999;
  host.model.minValueTickHeight = 1_000_000;
  host.model._priceAxisExpanded = true;

  for (const panel of host.model.panels) {
    panel.hGrid = false;
    panel.vGrid = false;
  }
}

function enableMainSeriesLivePrice(chart: ChartInstance): void {
  const host = chart as MiniChartHost;

  for (const panel of host.model.panels) {
    for (const object of panel.objects) {
      object.renderLegend = false;

      if (isMainPriceSeries(host, panel, object)) {
        object.priceLine = true;
        object.priceTag = true;
      } else {
        object.priceTag = false;
        object.priceLine = false;
      }
    }
  }
}

export function applyMiniChartChrome(chart: ChartInstance): void {
  const host = chart as MiniChartHost;
  const appearance = chart.getChartAppearanceSettings();

  chart.applyChartAppearanceSettings({
    ...appearance,
    gridVisible: false,
    gridMode: "none",
    lastPriceLineVisible: true,
    lastPriceLabelVisible: true,
  });

  chart.setMainDrawMode("Line");
  chart.setAutoScale(true);
  applyMiniChartLayoutOverrides(host);

  hideVolume(chart);
  configureMiniChartScriptVisibility(chart);
  enableMainSeriesLivePrice(chart);
  ensureMiniChartStrategyLayout(chart);
  pruneEmptyPanels(chart);
  reapplyMiniChartMarker(chart);
}

export function refreshMiniChartChrome(chart: ChartInstance): void {
  const host = chart as MiniChartHost;

  applyMiniChartLayoutOverrides(host);
  hideVolume(chart);
  configureMiniChartScriptVisibility(chart);
  enableMainSeriesLivePrice(chart);
  ensureMiniChartStrategyLayout(chart);
  pruneEmptyPanels(chart);
  reapplyMiniChartMarker(chart);

  if (!isMiniChartViewportUserAdjusted(chart)) {
    fitMiniChartAutoViewport(chart);
  }

  chart.setCursor("DEFAULT");
}
