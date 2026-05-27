import type { ChartRuntimeObject } from "./internal-types/objects";

/** Display names aligned with `DrawingTools.tsx` in react-chart-ui. */
export const DRAWING_TOOL_LABELS: Record<string, string> = {
  trendLine: "Trend line",
  parallelChannel: "Parallel Channel",
  triangle: "Triangle",
  arrow: "Arrow",
  hLine: "Horizontal line",
  vLine: "Vertical line",
  mLine: "Multi-line",
  abcd: "Abcd tool",
  ellipse: "Ellipse",
  vRange: "Vertical Range",
  hRange: "Horizontal Range",
  cycle: "Cycle",
  box: "Rectangle",
  textAnnotation: "Text",
  priceTag: "Price tag",
  longShortPosition: "Long / Short position",
  fibonLines: "Fibonacci Levels",
  timeRange: "Time range",
  timeBet: "Time bet",
  diNapoliLevels: "Di Napoli levels",
  diNapoliAbc: "Di Napoli ABCD",
};

export function getDrawingToolDisplayName(type: string): string | null {
  return DRAWING_TOOL_LABELS[type] ?? null;
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
  const toolbarLabel = getDrawingToolDisplayName(type);
  if (toolbarLabel) {
    return toolbarLabel;
  }

  const fallback = humanizeTypeName(type);
  return translate ? translate(fallback) : fallback;
}
