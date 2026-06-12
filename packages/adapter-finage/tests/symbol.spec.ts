import { describe, expect, it } from "vitest";
import {
  splitCompactForexSymbol,
  toDisplayForexSymbol,
  toFinageSymbol,
} from "../src/symbol";

describe("toFinageSymbol", () => {
  it("normalizes slash, dash, and compact forex symbols", () => {
    expect(toFinageSymbol("eur/usd")).toBe("EURUSD");
    expect(toFinageSymbol("EUR-USD")).toBe("EURUSD");
    expect(toFinageSymbol("EURUSD")).toBe("EURUSD");
    expect(toFinageSymbol("GBPUSD")).toBe("GBPUSD");
  });
});

describe("toDisplayForexSymbol", () => {
  it("formats compact forex pairs for display", () => {
    expect(toDisplayForexSymbol("EURUSD")).toBe("EUR/USD");
    expect(toDisplayForexSymbol("EUR/USD")).toBe("EUR/USD");
  });
});

describe("splitCompactForexSymbol", () => {
  it("splits common quote currencies", () => {
    expect(splitCompactForexSymbol("USDJPY")).toBe("USD/JPY");
  });
});
