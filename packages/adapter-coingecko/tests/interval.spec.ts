import { describe, expect, it } from "vitest";
import {
  chartIntervalForExeria,
  daysForInterval,
  resolveExeriaInterval,
} from "../src/interval";

describe("interval mapping", () => {
  it("resolves Exeria interval aliases", () => {
    expect(resolveExeriaInterval("1D")).toBe("1d");
    expect(resolveExeriaInterval("1H")).toBe("1h");
    expect(resolveExeriaInterval("")).toBe("1d");
  });

  it("maps intervals to CoinGecko OHLC day ranges", () => {
    expect(daysForInterval("1d")).toBe("90");
    expect(daysForInterval("1d", 120)).toBe("180");
    expect(daysForInterval("1d", 200)).toBe("max");
    expect(daysForInterval("1h")).toBe("7");
    expect(daysForInterval("1w")).toBe("max");
    expect(daysForInterval("1m")).toBe("1");
  });

  it("maps intervals to market chart granularity", () => {
    expect(chartIntervalForExeria("1d")).toBe("daily");
    expect(chartIntervalForExeria("1h")).toBe("hourly");
    expect(chartIntervalForExeria("5m")).toBeUndefined();
  });
});
