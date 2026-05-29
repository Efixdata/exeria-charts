import type { CoreChartModel } from "../internal-types/chart";
import type { ChartLayoutMode } from "./chartEnvironment";

export const DESKTOP_CHART_LAYOUT = {
  valueAxisWidth: 80,
  valueAxisPadding: 6,
  timeAxisHeight: 24,
  minValueTickHeight: 30,
  minTimeTickWidth: 108,
  endMargin: 100,
} as const;

export const COMPACT_CHART_LAYOUT = {
  valueAxisWidth: 60,
  valueAxisPadding: 4,
  timeAxisHeight: 20,
  minValueTickHeight: 26,
  minTimeTickWidth: 76,
  endMargin: 48,
} as const;

type LayoutKey = keyof typeof DESKTOP_CHART_LAYOUT;

const LAYOUT_KEYS: LayoutKey[] = [
  "valueAxisWidth",
  "valueAxisPadding",
  "timeAxisHeight",
  "minValueTickHeight",
  "minTimeTickWidth",
  "endMargin",
];

export interface LegendLayoutMetrics {
  startX: number;
  lineHeight: number;
  topOffset: number;
  pillHeight: number;
  pillPaddingY: number;
  legendFontKey: string;
  legendSubscriptFontKey: string;
}

export function getLegendLayoutMetrics(compact: boolean): LegendLayoutMetrics {
  if (compact) {
    return {
      startX: 8,
      lineHeight: 14,
      topOffset: 20,
      pillHeight: 14,
      pillPaddingY: 9,
      legendFontKey: "legendCompact",
      legendSubscriptFontKey: "legendSubscriptCompact",
    };
  }

  return {
    startX: 12,
    lineHeight: 18,
    topOffset: 24,
    pillHeight: 16,
    pillPaddingY: 11,
    legendFontKey: "legend",
    legendSubscriptFontKey: "legendSubscript",
  };
}

export function truncateCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (maxWidth <= 0) {
    return "";
  }

  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }

  const ellipsis = "…";
  let truncated = text;

  while (truncated.length > 1 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }

  return truncated.length > 0 ? truncated + ellipsis : ellipsis;
}

export function isModelCompactLayout(model: { _layoutMode?: ChartLayoutMode }): boolean {
  return model._layoutMode === "compact";
}

export function applyResponsiveChartLayout(
  model: CoreChartModel,
  layoutMode: ChartLayoutMode,
): boolean {
  const target = layoutMode === "compact" ? COMPACT_CHART_LAYOUT : DESKTOP_CHART_LAYOUT;
  let changed = model._layoutMode !== layoutMode;
  model._layoutMode = layoutMode;

  for (const key of LAYOUT_KEYS) {
    if (model[key] !== target[key]) {
      model[key] = target[key];
      changed = true;
    }
  }

  return changed;
}
