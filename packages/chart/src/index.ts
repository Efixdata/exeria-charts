import Chart from "./Chart";
import type { ChartInstance, ChartOptions } from "./types";

export * from "./types";
export type { ChartPanelObject } from "./internal-types/objects";
export * from "./dataAdapter";
export { intervalFromSymbol, milisFromIntervalSymbol } from "./intervalFromSymbol";
export {
  DEFAULT_LOCALE_ID,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isSupportedLocaleId,
  normalizeLocaleId,
  resolveLocaleDictionary,
  type LocaleId,
} from "./locale";
export { isLightChartColor, resolveChartThemeVariant } from "./chartSettings";
export {
  DRAWING_TOOL_LABEL_KEYS,
  getDrawingToolDisplayName,
  getDrawingToolLabelKey,
} from "./drawingToolLabels";
export {
  CHART_COMPACT_BREAKPOINT_PX,
  configureChartEnvironment,
  getChartEnvironment,
  getHitTolerance,
  hitTolerance,
  isCompactLayout,
  isSmallScreen,
  isTouchDevice,
  isTouchEnvironment,
  subscribeChartEnvironment,
  type ChartEnvironmentOptions,
  type ChartEnvironmentSnapshot,
  type ChartLayoutMode,
  type ChartLayoutModeOverride,
} from "./utils/chartEnvironment";
export {
  applyResponsiveChartLayout,
  COMPACT_CHART_LAYOUT,
  DESKTOP_CHART_LAYOUT,
  getLegendLayoutMetrics,
  isModelCompactLayout,
} from "./utils/compactLayout";
export { Chart };
export {
  clearExternalNewsFeed,
  findExternalNewsFeedPoint,
  getExternalNewsFeed,
  setExternalNewsFeed,
  type ExternalNewsFeedPoint,
  type ExternalNewsSentiment,
} from "./externalNewsFeed";
export type {
  NewsFeedAdapter,
  NewsFeedBundle,
  NewsFeedImpactDirection,
  NewsFeedImpactHorizon,
  NewsFeedImpactMeasure,
  NewsFeedImportance,
  NewsFeedPage,
  NewsFeedQuery,
  NewsFeedRecord,
  NewsFeedSentiment,
  NewsFeedSource,
} from "./newsFeedTypes";
export type {
  ArbChartScene,
  ArbChartSceneFocus,
  ArbChartSceneOverlay,
  ArbChartSceneScript,
  ArbMetrics,
  ArbSceneAnchor,
  ArbScenePriceField,
  ArbSceneDrawing,
  ArbSignalBundle,
  ArbSignalCategory,
  ArbSignalQuery,
  ArbSignalRecord,
} from "./arbSignalTypes";
export {
  clearInstrumentNewsFeed,
  getNewsFeedEvent,
  getNewsFeedEventByBarIndex,
  mapNewsFeedToMarkerPoints,
  resolveNewsBarIndex,
  setInstrumentNewsFeed,
} from "./newsFeedRuntime";

export function createChart(options: ChartOptions): ChartInstance {
	return new Chart(options);
}

export default Chart;
