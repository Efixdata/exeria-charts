import { describe, expect, it } from "vitest";
import {
  assertSupportedInterval,
  intradayWindowSeconds,
  intervalToMilliseconds,
  resolveDataSource,
  toEodhdIntradayInterval,
  toEodhdPeriod,
} from "../src/interval";

describe("resolveDataSource", () => {
  it("routes daily and higher intervals to EOD", () => {
    expect(resolveDataSource("1d")).toBe("eod");
    expect(resolveDataSource("1w")).toBe("eod");
    expect(resolveDataSource("1M")).toBe("eod");
  });

  it("routes intraday intervals to intraday API", () => {
    expect(resolveDataSource("1m")).toBe("intraday");
    expect(resolveDataSource("5m")).toBe("intraday");
    expect(resolveDataSource("1h")).toBe("intraday");
  });
});

describe("toEodhdPeriod", () => {
  it("maps exeria intervals to EOD periods", () => {
    expect(toEodhdPeriod("1d")).toBe("d");
    expect(toEodhdPeriod("1w")).toBe("w");
    expect(toEodhdPeriod("1M")).toBe("m");
  });
});

describe("toEodhdIntradayInterval", () => {
  it("maps exeria intervals to EODHD intraday intervals", () => {
    expect(toEodhdIntradayInterval("1h")).toBe("1h");
    expect(toEodhdIntradayInterval("5m")).toBe("5m");
  });
});

describe("assertSupportedInterval", () => {
  it("throws for unsupported intervals", () => {
    expect(() => assertSupportedInterval("15m")).toThrow(
      'EODHD does not support interval "15m"',
    );
    expect(() => assertSupportedInterval("4h")).toThrow(
      'EODHD does not support interval "4h"',
    );
  });
});

describe("intradayWindowSeconds", () => {
  it("returns provider window limits", () => {
    expect(intradayWindowSeconds("1m")).toBe(120 * 86_400);
    expect(intradayWindowSeconds("5m")).toBe(600 * 86_400);
    expect(intradayWindowSeconds("1h")).toBe(7200 * 86_400);
  });
});

describe("intervalToMilliseconds", () => {
  it("returns bar duration in milliseconds", () => {
    expect(intervalToMilliseconds("1h")).toBe(3_600_000);
    expect(intervalToMilliseconds("5m")).toBe(300_000);
  });
});
