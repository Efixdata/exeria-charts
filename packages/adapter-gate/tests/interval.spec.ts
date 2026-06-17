import { describe, expect, it } from "vitest";
import {
  isWsSupportedInterval,
  resolveExeriaInterval,
  toGateInterval,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to Gate intervals", () => {
    expect(toGateInterval("1h")).toBe("1h");
    expect(toGateInterval("1w")).toBe("7d");
  });

  it("resolves Gate intervals back to Exeria", () => {
    expect(resolveExeriaInterval("7d")).toBe("1w");
  });

  it("throws for unsupported intervals", () => {
    expect(() => toGateInterval("3m")).toThrow(/Unsupported Gate.io interval/);
    expect(() => toGateInterval("1M")).toThrow(/Unsupported Gate.io interval/);
  });

  it("marks supported intervals for websocket", () => {
    expect(isWsSupportedInterval("1h")).toBe(true);
    expect(isWsSupportedInterval("1w")).toBe(true);
  });
});
