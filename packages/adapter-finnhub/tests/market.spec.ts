import { describe, expect, it } from "vitest";
import { resolveFinnhubMarket } from "../src/market";

describe("resolveFinnhubMarket", () => {
  it("detects forex pairs", () => {
    expect(resolveFinnhubMarket("EURUSD")).toBe("forex");
    expect(resolveFinnhubMarket("EUR/USD")).toBe("forex");
    expect(resolveFinnhubMarket("OANDA:EUR_USD")).toBe("forex");
  });

  it("detects crypto pairs", () => {
    expect(resolveFinnhubMarket("BTCUSDT")).toBe("crypto");
    expect(resolveFinnhubMarket("BINANCE:BTCUSDT")).toBe("crypto");
  });

  it("detects US stocks and ETFs", () => {
    expect(resolveFinnhubMarket("AAPL")).toBe("stock");
    expect(resolveFinnhubMarket("SPY")).toBe("stock");
    expect(resolveFinnhubMarket("QQQ")).toBe("stock");
  });
});
