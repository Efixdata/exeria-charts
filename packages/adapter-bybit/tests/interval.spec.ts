import { describe, it, expect } from "vitest";
import {
  getKlineTopic,
  resolveExeriaInterval,
  toBybitInterval,
  toExeriaInterval,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to Bybit intervals", () => {
    expect(toBybitInterval("1m")).toBe("1");
    expect(toBybitInterval("1h")).toBe("60");
    expect(toBybitInterval("1d")).toBe("D");
    expect(toBybitInterval("1w")).toBe("W");
    expect(toBybitInterval("1M")).toBe("M");
  });

  it("maps Bybit intervals back to Exeria intervals", () => {
    expect(toExeriaInterval("60")).toBe("1h");
    expect(toExeriaInterval("D")).toBe("1d");
    expect(toExeriaInterval("W")).toBe("1w");
    expect(toExeriaInterval("M")).toBe("1M");
  });

  it("falls back to defaults for empty intervals", () => {
    expect(toBybitInterval("")).toBe("60");
    expect(resolveExeriaInterval("")).toBe("1h");
  });

  it("builds kline topics", () => {
    expect(getKlineTopic("btcusdt", "1h")).toBe("kline.60.BTCUSDT");
    expect(getKlineTopic("ETHUSDT", "1d")).toBe("kline.D.ETHUSDT");
  });
});
