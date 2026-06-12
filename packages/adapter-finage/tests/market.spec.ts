import { describe, expect, it } from "vitest";
import { resolveFinageMarket } from "../src/market";

describe("resolveFinageMarket", () => {
  it("detects forex pairs", () => {
    expect(resolveFinageMarket("EURUSD")).toBe("forex");
    expect(resolveFinageMarket("EUR/USD")).toBe("forex");
    expect(resolveFinageMarket("GBP-USD")).toBe("forex");
  });

  it("detects US stocks and ETFs", () => {
    expect(resolveFinageMarket("AAPL")).toBe("stock");
    expect(resolveFinageMarket("SPY")).toBe("stock");
    expect(resolveFinageMarket("QQQ")).toBe("stock");
  });
});
