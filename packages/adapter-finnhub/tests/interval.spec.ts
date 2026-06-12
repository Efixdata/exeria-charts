import { describe, expect, it } from "vitest";
import { intervalToMilliseconds, toFinnhubResolution } from "../src/interval";

describe("toFinnhubResolution", () => {
  it("maps exeria intervals to Finnhub resolution", () => {
    expect(toFinnhubResolution("1h")).toBe("60");
    expect(toFinnhubResolution("5m")).toBe("5");
    expect(toFinnhubResolution("1d")).toBe("D");
  });

  it("defaults unknown intervals to 60", () => {
    expect(toFinnhubResolution("unknown")).toBe("60");
  });
});

describe("intervalToMilliseconds", () => {
  it("returns bar duration in milliseconds", () => {
    expect(intervalToMilliseconds("1h")).toBe(3_600_000);
    expect(intervalToMilliseconds("5m")).toBe(300_000);
  });
});
