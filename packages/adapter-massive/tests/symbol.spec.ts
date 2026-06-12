import { describe, expect, it } from "vitest";
import {
  detectMassiveMarket,
  toDisplaySymbol,
  toMassiveTicker,
} from "../src/symbol";

describe("symbol mapping", () => {
  it("maps stock tickers without prefix", () => {
    expect(detectMassiveMarket("AAPL")).toBe("stocks");
    expect(toMassiveTicker("AAPL")).toBe("AAPL");
    expect(toDisplaySymbol("MSFT")).toBe("MSFT");
  });

  it("maps forex pairs to C: tickers", () => {
    expect(detectMassiveMarket("EUR/USD")).toBe("forex");
    expect(toMassiveTicker("EUR/USD")).toBe("C:EURUSD");
    expect(toMassiveTicker("GBPUSD")).toBe("C:GBPUSD");
    expect(toDisplaySymbol("C:EURUSD")).toBe("EUR/USD");
  });

  it("maps crypto pairs to X: tickers", () => {
    expect(detectMassiveMarket("BTC-USD")).toBe("crypto");
    expect(toMassiveTicker("BTC-USD")).toBe("X:BTCUSD");
    expect(toMassiveTicker("ETHUSD")).toBe("X:ETHUSD");
    expect(toDisplaySymbol("X:BTCUSD")).toBe("BTC/USD");
  });

  it("preserves explicit Massive prefixes", () => {
    expect(toMassiveTicker("X:BTCUSD")).toBe("X:BTCUSD");
    expect(toMassiveTicker("C:EURUSD")).toBe("C:EURUSD");
  });
});
