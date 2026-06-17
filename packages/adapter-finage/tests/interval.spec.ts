import { describe, expect, it } from "vitest";
import { intervalToMilliseconds, toFinageInterval } from "../src/interval";

describe("toFinageInterval", () => {
  it("maps exeria intervals to Finage multiply/time", () => {
    expect(toFinageInterval("1h")).toEqual({ multiply: 1, time: "hour" });
    expect(toFinageInterval("5m")).toEqual({ multiply: 5, time: "minute" });
    expect(toFinageInterval("1d")).toEqual({ multiply: 1, time: "day" });
  });

  it("defaults unknown intervals to 1 hour", () => {
    expect(toFinageInterval("unknown")).toEqual({ multiply: 1, time: "hour" });
  });
});

describe("intervalToMilliseconds", () => {
  it("returns bar duration in milliseconds", () => {
    expect(intervalToMilliseconds("1h")).toBe(3_600_000);
    expect(intervalToMilliseconds("5m")).toBe(300_000);
  });
});
