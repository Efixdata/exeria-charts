import { describe, expect, it } from "vitest";
import {
  estimateRangeSeconds,
  granularitySeconds,
  toCoinbaseGranularity,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to Coinbase granularities", () => {
    expect(toCoinbaseGranularity("1h")).toBe("ONE_HOUR");
    expect(toCoinbaseGranularity("1d")).toBe("ONE_DAY");
    expect(toCoinbaseGranularity("5m")).toBe("FIVE_MINUTE");
  });

  it("throws for unsupported intervals", () => {
    expect(() => toCoinbaseGranularity("1w")).toThrow(
      "Unsupported Coinbase interval",
    );
    expect(() => toCoinbaseGranularity("3m")).toThrow(
      "Unsupported Coinbase interval",
    );
  });

  it("estimates lookback window from interval and limit", () => {
    expect(granularitySeconds("1d")).toBe(86_400);
    expect(estimateRangeSeconds("1h", 24)).toBe(24 * 3600);
    expect(estimateRangeSeconds("1d", 500)).toBe(349 * 86_400);
  });
});
