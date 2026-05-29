import { describe, expect, it } from "vitest";
import {
  formatCompactAxisPrice,
  formatValueAxisPriceLabel,
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

describe("formatValueAxisPriceLabel", () => {
  it("uses compact labels until expanded", () => {
    expect(formatValueAxisPriceLabel(40900, 2, { expanded: false })).toBe("900");
    expect(formatValueAxisPriceLabel(20374, 2, { expanded: false })).toBe("374");
    expect(formatValueAxisPriceLabel(40900.12, 2, { expanded: true })).toBe("40900.12");
  });
});
