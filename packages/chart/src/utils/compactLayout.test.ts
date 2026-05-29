import { describe, expect, it } from "vitest";
import type { CoreChartModel } from "../internal-types/chart";
import {
  applyResponsiveChartLayout,
  COMPACT_CHART_LAYOUT,
  DESKTOP_CHART_LAYOUT,
  getLegendLayoutMetrics,
  isModelCompactLayout,
  truncateCanvasText,
} from "./compactLayout";

function createModel(): CoreChartModel {
  return {
    ...DESKTOP_CHART_LAYOUT,
    panels: [],
    instrumentsSeries: [],
    scripts: [],
    mainSeries: "",
    autoScale: true,
    periodWidth: 6,
    viewportLeft: 0,
    extremesMargin: 0.1,
    minPanelHeight: 24,
    orders: { list: [], visible: true, selected: false },
    positions: { list: [], visible: true, selected: false },
    _width: 400,
    _height: 300,
    _timeAxisWidth: 320,
    _midOffset: 3,
    _leftIndex: 0,
    _rightIndex: 50,
  } as CoreChartModel;
}

describe("compactLayout", () => {
  it("applies compact axis metrics", () => {
    const model = createModel();
    applyResponsiveChartLayout(model, "compact");

    expect(model.valueAxisWidth).toBe(COMPACT_CHART_LAYOUT.valueAxisWidth);
    expect(model.minTimeTickWidth).toBe(COMPACT_CHART_LAYOUT.minTimeTickWidth);
    expect(model.endMargin).toBe(COMPACT_CHART_LAYOUT.endMargin);
    expect(isModelCompactLayout(model)).toBe(true);
  });

  it("restores desktop axis metrics", () => {
    const model = createModel();
    applyResponsiveChartLayout(model, "compact");
    applyResponsiveChartLayout(model, "desktop");

    expect(model.valueAxisWidth).toBe(DESKTOP_CHART_LAYOUT.valueAxisWidth);
    expect(isModelCompactLayout(model)).toBe(false);
  });

  it("returns smaller legend metrics in compact mode", () => {
    const desktop = getLegendLayoutMetrics(false);
    const compact = getLegendLayoutMetrics(true);

    expect(compact.startX).toBeLessThan(desktop.startX);
    expect(compact.lineHeight).toBeLessThan(desktop.lineHeight);
    expect(compact.legendFontKey).toBe("legendCompact");
  });

  it("truncates overflowing canvas text with ellipsis", () => {
    const ctx = {
      measureText: (text: string) => ({ width: text.length * 10 }),
    } as unknown as CanvasRenderingContext2D;

    const truncated = truncateCanvasText(ctx, "ABCDEFGHIJKLMNOP", 40);
    expect(truncated.endsWith("…")).toBe(true);
    expect(truncated.length).toBeLessThan("ABCDEFGHIJKLMNOP".length);
  });
});
