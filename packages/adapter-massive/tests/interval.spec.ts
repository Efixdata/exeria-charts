import { describe, expect, it } from "vitest";
import { estimateRangeMs, toMassiveRange } from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to Massive range params", () => {
    expect(toMassiveRange("1h")).toEqual({ multiplier: 1, timespan: "hour" });
    expect(toMassiveRange("1d")).toEqual({ multiplier: 1, timespan: "day" });
    expect(toMassiveRange("15m")).toEqual({ multiplier: 15, timespan: "minute" });
  });

  it("throws for unsupported intervals", () => {
    expect(() => toMassiveRange("2d")).toThrow("Unsupported Massive interval");
  });

  it("estimates a lookback window from interval and limit", () => {
    const range = estimateRangeMs("1h", 24);
    expect(range).toBeGreaterThan(24 * 3_600_000);
  });
});
