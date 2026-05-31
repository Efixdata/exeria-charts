import { describe, expect, it } from "vitest";
import { getPriceAxisChromeLayout, layoutPriceTag } from "./priceAxisLayout";

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

  it("reserves top band for prefix and expand hint", () => {
    const chrome = getPriceAxisChromeLayout(100, false, {
      usePrefixHeader: true,
      showExpandHint: true,
    });

    expect(chrome.prefixY).toBeGreaterThan(100);
    expect(chrome.hintCenterY).toBeGreaterThan(chrome.prefixY);
    expect(chrome.minTickY).toBeGreaterThan(chrome.hintCenterY);
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
