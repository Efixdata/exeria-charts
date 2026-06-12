import { describe, expect, it } from "vitest";
import { splitCompactForexSymbol, toTwelveDataSymbol } from "../src/symbol";

describe("toTwelveDataSymbol", () => {
  it("normalizes slash, dash, and compact forex symbols", () => {
    expect(toTwelveDataSymbol("eur/usd")).toBe("EUR/USD");
    expect(toTwelveDataSymbol("EUR-USD")).toBe("EUR/USD");
    expect(toTwelveDataSymbol("EURUSD")).toBe("EUR/USD");
    expect(toTwelveDataSymbol("GBPUSD")).toBe("GBP/USD");
  });

  it("passes through stock tickers", () => {
    expect(toTwelveDataSymbol("AAPL")).toBe("AAPL");
  });
});

describe("splitCompactForexSymbol", () => {
  it("splits common quote currencies", () => {
    expect(splitCompactForexSymbol("USDJPY")).toBe("USD/JPY");
  });
});
