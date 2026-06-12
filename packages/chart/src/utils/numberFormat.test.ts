import { describe, expect, it } from "vitest";
import { formatDataPrice, trimInsignificantFractionZeros } from "./numberFormat";

describe("trimInsignificantFractionZeros", () => {
  it("removes trailing fractional zeros", () => {
    expect(trimInsignificantFractionZeros("64.900000")).toBe("64.9");
    expect(trimInsignificantFractionZeros("40900.00")).toBe("40900");
    expect(trimInsignificantFractionZeros("1.2300")).toBe("1.23");
  });
});

describe("formatDataPrice", () => {
  it("caps at max precision without padding zeros", () => {
    expect(formatDataPrice(64.9, 6)).toBe("64.9");
    expect(formatDataPrice(20374, 2)).toBe("20374");
    expect(formatDataPrice(1.234567, 4)).toBe("1.2346");
  });
});
