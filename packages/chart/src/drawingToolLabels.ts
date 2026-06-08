import type { ChartRuntimeObject } from "./internal-types/objects";

/** Locale keys for drawing tool display names (toolbar + settings layers). */
export const DRAWING_TOOL_LABEL_KEYS: Record<string, string> = {
  trendLine: "drawing_tool_trend_line",
  trendRay: "drawing_tool_trend_ray",
  hRay: "drawing_tool_horizontal_ray",
  vRay: "drawing_tool_vertical_ray",
  crossLine: "drawing_tool_cross_line",
  parallelChannel: "drawing_tool_parallel_channel",
  pitchfork: "drawing_tool_pitchfork",
  regressionChannel: "drawing_tool_regression_channel",
  gannFan: "drawing_tool_gann_fan",
  gannGrid: "drawing_tool_gann_grid",
  gannBox: "drawing_tool_gann_box",
  triangle: "drawing_tool_triangle",
  arrow: "drawing_tool_arrow",
  brush: "drawing_tool_brush",
  hLine: "drawing_tool_horizontal_line",
  vLine: "drawing_tool_vertical_line",
  mLine: "drawing_tool_multi_line",
  abcd: "drawing_tool_abcd",
  ellipse: "drawing_tool_ellipse",
  vRange: "drawing_tool_vertical_range",
  hRange: "drawing_tool_horizontal_range",
  cycle: "drawing_tool_cycle",
  box: "drawing_tool_rectangle",
  fixedRangeVolumeProfile: "drawing_tool_volume_profile",
  textAnnotation: "drawing_tool_text",
  priceTag: "drawing_tool_price_tag",
  longShortPosition: "drawing_tool_long_short_position",
  fibonLines: "drawing_tool_fibonacci_levels",
  fibonExtension: "drawing_tool_fibonacci_extension",
  fibonTimeZone: "drawing_tool_fibonacci_time_zone",
  fibonChannel: "drawing_tool_fibonacci_channel",
  fibonArcs: "drawing_tool_fibonacci_arcs",
  fibonCircles: "drawing_tool_fibonacci_circles",
  timeRange: "drawing_tool_time_range",
  timeBet: "drawing_tool_time_bet",
  diNapoliLevels: "drawing_tool_di_napoli_levels",
  diNapoliAbc: "drawing_tool_di_napoli_abcd",
};

/** @deprecated Use DRAWING_TOOL_LABEL_KEYS with chart.translate(). */
export const DRAWING_TOOL_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(DRAWING_TOOL_LABEL_KEYS).map(([type, key]) => [type, key]),
);

export function getDrawingToolLabelKey(type: string): string | null {
  return DRAWING_TOOL_LABEL_KEYS[type] ?? null;
}

export function getDrawingToolDisplayName(
  type: string,
  translate?: (text: string) => string,
): string | null {
  const key = getDrawingToolLabelKey(type);
  if (!key) {
    return null;
  }

  if (!translate) {
    return key;
  }

  const translated = translate(key);
  return translated !== key ? translated : null;
}

function humanizeTypeName(type: string): string {
  const spaced = type
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();

  if (!spaced) {
    return "Drawing";
  }

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function resolveDrawingDisplayLabel(
  object: ChartRuntimeObject,
  translate?: (text: string) => string,
): string {
  if (typeof object.text === "string" && object.text.trim().length > 0) {
    const text = object.text.trim();
    const type = String(object.type || "");
    if (type !== "textAnnotation" || text.toLowerCase() !== "sample text") {
      return text;
    }
  }

  const type = String(object.type || "drawing");
  const toolbarLabel = getDrawingToolDisplayName(type, translate);
  if (toolbarLabel) {
    return toolbarLabel;
  }

  const fallback = humanizeTypeName(type);
  return translate ? translate(fallback) : fallback;
}
