import { describe, expect, it } from "vitest";
import { resolveCandleDateRange } from "../src/date-range";

describe("resolveCandleDateRange", () => {
  it("computes unix from/to when only limit is provided", () => {
    const to = new Date("2024-06-07T00:00:00.000Z");
    const range = resolveCandleDateRange({
      to,
      limit: 24,
      interval: "1h",
    });

    expect(range.to).toBe(Math.floor(to.getTime() / 1000));
    expect(range.from).toBeLessThan(range.to);
  });

  it("respects explicit from/to", () => {
    const from = new Date("2024-01-01T00:00:00.000Z");
    const to = new Date("2024-01-07T00:00:00.000Z");
    const range = resolveCandleDateRange({
      from,
      to,
      interval: "1h",
      limit: 100,
    });

    expect(range).toEqual({
      from: Math.floor(from.getTime() / 1000),
      to: Math.floor(to.getTime() / 1000),
    });
  });
});
