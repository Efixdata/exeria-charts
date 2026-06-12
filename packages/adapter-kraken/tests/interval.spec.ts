import { describe, expect, it } from "vitest";
import {
  getSubscriptionKey,
  resolveExeriaInterval,
  toExeriaInterval,
  toKrakenInterval,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to Kraken minute buckets", () => {
    expect(toKrakenInterval("1m")).toBe(1);
    expect(toKrakenInterval("1h")).toBe(60);
    expect(toKrakenInterval("1d")).toBe(1440);
    expect(toKrakenInterval("1w")).toBe(10080);
    expect(toKrakenInterval("1M")).toBe(21600);
  });

  it("maps Kraken minutes back to Exeria intervals", () => {
    expect(toExeriaInterval(60)).toBe("1h");
    expect(toExeriaInterval(1440)).toBe("1d");
  });

  it("resolves interval aliases", () => {
    expect(resolveExeriaInterval("1H")).toBe("1h");
    expect(resolveExeriaInterval("")).toBe("1h");
  });

  it("throws for unsupported intervals", () => {
    expect(() => toKrakenInterval("2h")).toThrow(
      "Unsupported Kraken interval",
    );
  });

  it("builds subscription keys", () => {
    expect(getSubscriptionKey("BTC/USD", 60)).toBe("BTC/USD:60");
  });
});
