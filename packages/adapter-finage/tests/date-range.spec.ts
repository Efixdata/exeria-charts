import { describe, expect, it } from "vitest";
import { formatFinageDate, resolveAggregatesDateRange } from "../src/date-range";

describe("formatFinageDate", () => {
  it("formats dates as YYYY-MM-DD", () => {
    expect(formatFinageDate(new Date("2024-06-01T12:00:00.000Z"))).toBe(
      "2024-06-01",
    );
  });
});

describe("resolveAggregatesDateRange", () => {
  it("computes from/to when only limit is provided", () => {
    const to = new Date("2024-06-07T00:00:00.000Z");
    const range = resolveAggregatesDateRange({
      to,
      limit: 24,
      interval: "1h",
    });

    expect(range.to).toBe("2024-06-07");
    expect(range.from).toBe("2024-06-06");
  });

  it("respects explicit from/to", () => {
    const range = resolveAggregatesDateRange({
      from: new Date("2024-01-01T00:00:00.000Z"),
      to: new Date("2024-01-07T00:00:00.000Z"),
      interval: "1h",
      limit: 100,
    });

    expect(range).toEqual({ from: "2024-01-01", to: "2024-01-07" });
  });
});
