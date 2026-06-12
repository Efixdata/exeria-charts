import { describe, it, expect } from "vitest";
import {
  getCandleChannel,
  getSubscriptionKey,
  resolveExeriaInterval,
  toOkxBar,
  toExeriaInterval,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to OKX bar sizes", () => {
    expect(toOkxBar("1m")).toBe("1m");
    expect(toOkxBar("1h")).toBe("1H");
    expect(toOkxBar("1d")).toBe("1D");
    expect(toOkxBar("1w")).toBe("1W");
    expect(toOkxBar("1M")).toBe("1M");
  });

  it("maps OKX bars back to Exeria intervals", () => {
    expect(toExeriaInterval("1H")).toBe("1h");
    expect(toExeriaInterval("1D")).toBe("1d");
    expect(toExeriaInterval("1W")).toBe("1w");
    expect(toExeriaInterval("1M")).toBe("1M");
  });

  it("falls back to defaults for empty intervals", () => {
    expect(toOkxBar("")).toBe("1H");
    expect(resolveExeriaInterval("")).toBe("1h");
  });

  it("builds candle channels and subscription keys", () => {
    expect(getCandleChannel("1h")).toBe("candle1H");
    expect(getCandleChannel("1d")).toBe("candle1D");
    expect(getSubscriptionKey("candle1H", "BTC-USDT")).toBe("candle1H:BTC-USDT");
  });
});
