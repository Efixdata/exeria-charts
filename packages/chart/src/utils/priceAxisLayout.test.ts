import { describe, expect, it } from "vitest";
import {
  COLLAPSED_LEDGER_TEXT_GAP_PX,
  getCollapsedLedgerDividerX,
  getPriceAxisChromeLayout,
  layoutLedgerAxisColumn,
  layoutPriceTag,
} from "./priceAxisLayout";

function mockMeasureCtx(widthByText: Record<string, number>): CanvasRenderingContext2D {
  return {
    measureText(text: string) {
      return { width: widthByText[text] ?? 0 };
    },
  } as CanvasRenderingContext2D;
}

describe("layoutPriceTag", () => {
  const model = {
    _width: 400,
    valueAxisPadding: 6,
  };

  it("keeps tags inside the axis when expanded", () => {
    const layout = layoutPriceTag(
      { ...model, _priceAxisExpanded: true },
      { valueAxisWidth: 60 },
      72,
      100,
    );

    expect(layout.allowOverflowLeft).toBe(false);
    expect(layout.tagLeft).toBe(340);
    expect(layout.tagWidth).toBe(60);
    expect(layout.zerosToReduce).toBe(0);
  });

  it("puts ledger anchor at top and expand hint at bottom", () => {
    const panelHeight = 300;
    const chrome = getPriceAxisChromeLayout(100, panelHeight, false, {
      useLedgerColumn: true,
      showExpandHint: true,
    });

    expect(chrome.anchorRowY).toBeGreaterThan(100);
    expect(chrome.hintCenterY).toBeGreaterThan(chrome.anchorRowY);
    expect(chrome.hintCenterY).toBeLessThan(100 + panelHeight);
    expect(chrome.minTickY).toBeLessThan(chrome.maxTickY);
    expect(chrome.maxTickY).toBeLessThan(chrome.hintCenterY);
  });

  it("keeps ledger column anchors fixed so head and suffix digits align", () => {
    const panelStartX = 340;
    const valueAxisWidth = 61;
    const valueAxisPadding = 4;
    const ctx = mockMeasureCtx({
      "20": 14,
      "374": 22,
      "400": 24,
      "300": 24,
      "200": 24,
    });

    const column = layoutLedgerAxisColumn(
      ctx,
      "20",
      ["400", "300", "200"],
      "374",
      panelStartX,
      valueAxisWidth,
      valueAxisPadding,
    );

    expect(column.suffixRightX).toBe(panelStartX + valueAxisWidth - valueAxisPadding);
    expect(column.columnSplitX).toBe(column.suffixRightX - column.maxSuffixWidth);

    const tagColumn = layoutLedgerAxisColumn(
      ctx,
      "20",
      ["400", "300", "200", "374"],
      "374",
      panelStartX,
      valueAxisWidth,
      valueAxisPadding,
    );

    expect(tagColumn.suffixRightX).toBe(column.suffixRightX);
    expect(tagColumn.columnSplitX).toBe(column.columnSplitX);
  });

  it("places collapsed divider 2px left of the axis band without shifting text", () => {
    const panelStartX = 340;
    expect(getCollapsedLedgerDividerX(panelStartX)).toBe(
      panelStartX - COLLAPSED_LEDGER_TEXT_GAP_PX,
    );
  });

  it("allows tags to extend left when collapsed", () => {
    const layout = layoutPriceTag(
      { ...model, _priceAxisExpanded: false },
      { valueAxisWidth: 36 },
      72,
      100,
    );

    expect(layout.allowOverflowLeft).toBe(true);
    expect(layout.tagWidth).toBeGreaterThan(36);
    expect(layout.tagLeft).toBeLessThan(364);
    expect(layout.textAlign).toBe("right");
    expect(layout.zerosToReduce).toBe(0);
  });
});
