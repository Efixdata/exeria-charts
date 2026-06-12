import { describe, expect, it } from "vitest";
import {
  splitCompactForexSymbol,
  toDisplayForexSymbol,
  toEodhdSymbol,
} from "../src/symbol";

describe("toEodhdSymbol", () => {
  it("normalizes US stocks", () => {
    expect(toEodhdSymbol("aapl")).toBe("AAPL.US");
    expect(toEodhdSymbol("AAPL.US")).toBe("AAPL.US");
    expect(toEodhdSymbol("SPY", { defaultStockExchange: "US" })).toBe(
      "SPY.US",
    );
  });

  it("normalizes forex pairs", () => {
    expect(toEodhdSymbol("eur/usd")).toBe("EURUSD.FOREX");
    expect(toEodhdSymbol("EUR-USD")).toBe("EURUSD.FOREX");
    expect(toEodhdSymbol("EURUSD")).toBe("EURUSD.FOREX");
    expect(toEodhdSymbol("EURUSD.FOREX")).toBe("EURUSD.FOREX");
  });

  it("normalizes crypto pairs", () => {
    expect(toEodhdSymbol("BTC-USD")).toBe("BTC-USD.CC");
    expect(toEodhdSymbol("BTC/USD")).toBe("BTC-USD.CC");
    expect(toEodhdSymbol("BTC-USD.CC")).toBe("BTC-USD.CC");
  });
});

describe("toDisplayForexSymbol", () => {
  it("formats forex pairs for display", () => {
    expect(toDisplayForexSymbol("EURUSD.FOREX")).toBe("EUR/USD");
    expect(toDisplayForexSymbol("EURUSD")).toBe("EUR/USD");
  });
});

describe("splitCompactForexSymbol", () => {
  it("splits common quote currencies", () => {
    expect(splitCompactForexSymbol("USDJPY")).toBe("USD/JPY");
  });
});
