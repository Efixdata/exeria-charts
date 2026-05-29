import Chart from "./Chart";
import type { ChartInstance, ChartOptions } from "./types";

export * from "./types";
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

export function createChart(options: ChartOptions): ChartInstance {
	return new Chart(options);
}

export default Chart;
