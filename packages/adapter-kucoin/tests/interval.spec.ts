import { describe, expect, it } from "vitest";
import {
  getCandleTopic,
  getSubscriptionKey,
  isWsSupportedInterval,
  resolveExeriaInterval,
  toExeriaInterval,
  toKucoinType,
} from "../src/interval";

describe("interval mapping", () => {
  it("maps Exeria intervals to KuCoin candle types", () => {
    expect(toKucoinType("1m")).toBe("1min");
    expect(toKucoinType("5m")).toBe("5min");
    expect(toKucoinType("1h")).toBe("1hour");
    expect(toKucoinType("1d")).toBe("1day");
    expect(toKucoinType("1w")).toBe("1week");
  });

  it("maps KuCoin types back to Exeria intervals", () => {
    expect(toExeriaInterval("1hour")).toBe("1h");
    expect(toExeriaInterval("1day")).toBe("1d");
  });

  it("resolves interval aliases", () => {
    expect(resolveExeriaInterval("")).toBe("1h");
    expect(resolveExeriaInterval("1hour")).toBe("1h");
  });

  it("throws for unsupported intervals", () => {
    expect(() => toKucoinType("1M")).toThrow("Unsupported KuCoin interval");
  });

  it("builds candle topics and subscription keys", () => {
    expect(getCandleTopic("BTC-USDT", "1h")).toBe(
      "/market/candles:BTC-USDT_1hour",
    );
    expect(getSubscriptionKey("/market/candles:BTC-USDT_1hour")).toBe(
      "/market/candles:BTC-USDT_1hour",
    );
  });

  it("marks 5m as REST-only for websocket", () => {
    expect(isWsSupportedInterval("1h")).toBe(true);
    expect(isWsSupportedInterval("5m")).toBe(false);
  });
});
