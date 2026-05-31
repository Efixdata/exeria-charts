import { describe, expect, it } from "vitest";
import {
  computeValueAxisCommonPrefix,
  deriveCompactAxisHeadPrefix,
  formatCompactAxisPrice,
  formatFullAxisPrice,
  formatValueAxisPriceLabel,
  integerHeadFromFormatted,
  layoutValueAxisLabels,
  splitCompactAxisByHead,
  trimInsignificantFractionZeros,
  valuesShareCompactHead,
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

describe("splitCompactAxisByHead", () => {
  it("splits integer head and suffix on decimal point", () => {
    expect(splitCompactAxisByHead(20374, 0, "20")).toEqual({
      head: "20",
      suffix: "374",
      full: "20374",
    });
    expect(splitCompactAxisByHead(25500, 0, "25")).toEqual({
      head: "25",
      suffix: "500",
      full: "25500",
    });
  });

  it("keeps fractional part in suffix column", () => {
    expect(splitCompactAxisByHead(20374.5, 1, "20")).toEqual({
      head: "20",
      suffix: "374.5",
      full: "20374.5",
    });
  });
});

describe("deriveCompactAxisHeadPrefix", () => {
  it("uses integer heads for typical chart prices like 20374", () => {
    expect(deriveCompactAxisHeadPrefix([20374, 20400, 20450], 0)).toBe("20");
  });

  it("uses integer heads for large round prices", () => {
    expect(deriveCompactAxisHeadPrefix([206600, 206400, 206200], 0)).toBe("206");
  });
});

describe("valuesShareCompactHead", () => {
  it("rejects mixed magnitude bands", () => {
    expect(valuesShareCompactHead([19386, 20374], 0, "20")).toBe(false);
    expect(valuesShareCompactHead([20374, 20450], 0, "20")).toBe(true);
  });
});

describe("layoutValueAxisLabels", () => {
  it("enables ledger only for coherent tick range", () => {
    const layout = layoutValueAxisLabels([412340, 412350, 412360], 0, false);
    expect(layout.usePrefixHeader).toBe(true);
    expect(layout.prefix).toBe("412");
  });

  it("disables ledger when heads would diverge", () => {
    const layout = layoutValueAxisLabels([19386, 20374], 0, false);
    expect(layout.usePrefixHeader).toBe(false);
  });
});

describe("formatValueAxisPriceLabel", () => {
  it("uses suffix column when head prefix is shared", () => {
    expect(formatValueAxisPriceLabel(20374, 0, { expanded: false, prefix: "20" })).toBe("374");
    expect(formatValueAxisPriceLabel(20450, 0, { expanded: false, prefix: "20" })).toBe("450");
  });

  it("uses compact labels until expanded", () => {
    expect(formatValueAxisPriceLabel(40900, 2, { expanded: false })).toBe("900");
    expect(formatValueAxisPriceLabel(40900.12, 2, { expanded: true })).toBe("40900.12");
  });
});

describe("integerHeadFromFormatted", () => {
  it("strips last three integer digits", () => {
    expect(integerHeadFromFormatted("20374")).toBe("20");
    expect(integerHeadFromFormatted("19386.62")).toBe("19");
  });
});

describe("computeValueAxisCommonPrefix", () => {
  it("finds shared prefix across tick labels", () => {
    expect(computeValueAxisCommonPrefix(["412340", "412350", "412360"])).toBe("4123");
    expect(computeValueAxisCommonPrefix(["1.2340", "1.2350", "1.2360"])).toBe("1.23");
  });
});
