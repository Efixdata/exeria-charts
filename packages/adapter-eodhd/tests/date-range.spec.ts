import { describe, expect, it } from "vitest";
import {
  resolveEodDateRange,
  resolveIntradayUnixRange,
  splitIntradayWindows,
} from "../src/date-range";

describe("resolveEodDateRange", () => {
  it("formats YYYY-MM-DD bounds", () => {
    const to = new Date("2024-06-10T12:00:00.000Z");
    const from = new Date("2024-06-01T12:00:00.000Z");

    const range = resolveEodDateRange({
      interval: "1d",
      from,
      to,
      limit: 10,
    });

    expect(range.from).toBe("2024-06-01");
    expect(range.to).toBe("2024-06-10");
  });
});

describe("resolveIntradayUnixRange", () => {
  it("returns unix second bounds", () => {
    const to = new Date("2024-06-10T12:00:00.000Z");
    const from = new Date("2024-06-10T10:00:00.000Z");

    const range = resolveIntradayUnixRange({
      interval: "1h",
      from,
      to,
      limit: 2,
    });

    expect(range.to).toBe(Math.floor(to.getTime() / 1000));
    expect(range.from).toBe(Math.floor(from.getTime() / 1000));
  });
});

describe("splitIntradayWindows", () => {
  it("splits ranges larger than the 1m window", () => {
    const maxWindow = 120 * 86_400;
    const windows = splitIntradayWindows({
      interval: "1m",
      from: 1_000_000,
      to: 1_000_000 + maxWindow + 10_000,
    });

    expect(windows.length).toBeGreaterThan(1);
    expect(windows[0]?.from).toBe(1_000_000);
    expect(windows.at(-1)?.to).toBe(1_000_000 + maxWindow + 10_000);
  });
});
