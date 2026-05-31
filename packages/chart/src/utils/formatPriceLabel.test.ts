import { describe, expect, it } from "vitest";
import {
  computeValueAxisCommonPrefix,
  deriveCompactAxisPrefix,
  formatCompactAxisPrice,
  formatFullAxisPrice,
  formatValueAxisPriceLabel,
  layoutValueAxisLabels,
  trimInsignificantFractionZeros,
} from "./formatPriceLabel";

describe("formatCompactAxisPrice", () => {
  it("limits significant digits for mid-range prices", () => {
    expect(formatCompactAxisPrice(1.234567, 6)).toBe("1.23");
    expect(formatCompactAxisPrice(98765.4321, 6).length).toBeLessThanOrEqual(9);
  });

  it("uses compact notation for very large values", () => {
    expect(formatCompactAxisPrice(2_500_000, 4)).toContain("M");
  });
});

describe("trimInsignificantFractionZeros", () => {
  it("removes trailing fractional zeros", () => {
    expect(trimInsignificantFractionZeros("40900.00")).toBe("40900");
    expect(trimInsignificantFractionZeros("1.2300")).toBe("1.23");
  });
});

describe("formatFullAxisPrice", () => {
  it("formats with instrument precision and trims zeros", () => {
    expect(formatFullAxisPrice(40900, 2)).toBe("40900");
    expect(formatFullAxisPrice(40900.12, 2)).toBe("40900.12");
  });
});

describe("computeValueAxisCommonPrefix", () => {
  it("finds shared prefix across tick labels", () => {
    expect(computeValueAxisCommonPrefix(["412340", "412350", "412360"])).toBe("4123");
    expect(computeValueAxisCommonPrefix(["1.2340", "1.2350", "1.2360"])).toBe("1.23");
  });

  it("returns empty when labels differ too early", () => {
    expect(computeValueAxisCommonPrefix(["100", "900"])).toBe("");
  });
});

describe("deriveCompactAxisPrefix", () => {
  it("uses range prefix for typical chart prices like 20374", () => {
    expect(deriveCompactAxisPrefix([20374, 20400, 20450], 0)).toBe("20");
  });
});

describe("layoutValueAxisLabels", () => {
  it("enables prefix header for similar prices", () => {
    const layout = layoutValueAxisLabels([412340, 412350, 412360], 0, false);
    expect(layout.usePrefixHeader).toBe(true);
    expect(layout.prefix).toBe("4123");
  });

  it("disables prefix header when expanded", () => {
    const layout = layoutValueAxisLabels([40900, 40950, 41000], 0, true);
    expect(layout.usePrefixHeader).toBe(false);
  });
});

describe("formatValueAxisPriceLabel", () => {
  it("uses suffix labels when a common prefix is provided", () => {
    expect(
      formatValueAxisPriceLabel(40900, 0, { expanded: false, prefix: "409" }),
    ).toBe("00");
    expect(
      formatValueAxisPriceLabel(40950, 0, { expanded: false, prefix: "409" }),
    ).toBe("50");
  });

  it("uses compact labels until expanded", () => {
    expect(formatValueAxisPriceLabel(40900, 2, { expanded: false })).toBe("900");
    expect(formatValueAxisPriceLabel(20374, 2, { expanded: false })).toBe("374");
    expect(formatValueAxisPriceLabel(40900.12, 2, { expanded: true })).toBe("40900.12");
  });
});
