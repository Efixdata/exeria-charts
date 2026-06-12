import { describe, expect, it } from "vitest";
import {
  splitCompactForexSymbol,
  toDisplayForexSymbol,
  toFinnhubSymbol,
} from "../src/symbol";

describe("toFinnhubSymbol", () => {
  it("normalizes stocks", () => {
    expect(toFinnhubSymbol("aapl")).toBe("AAPL");
    expect(toFinnhubSymbol("SPY")).toBe("SPY");
  });

  it("normalizes forex pairs", () => {
    expect(toFinnhubSymbol("eur/usd")).toBe("OANDA:EUR_USD");
    expect(toFinnhubSymbol("EUR-USD")).toBe("OANDA:EUR_USD");
    expect(toFinnhubSymbol("EURUSD")).toBe("OANDA:EUR_USD");
    expect(toFinnhubSymbol("OANDA:EUR_USD")).toBe("OANDA:EUR_USD");
  });

  it("normalizes crypto pairs", () => {
    expect(toFinnhubSymbol("BTCUSDT")).toBe("BINANCE:BTCUSDT");
    expect(toFinnhubSymbol("BINANCE:BTCUSDT")).toBe("BINANCE:BTCUSDT");
  });
});

describe("toDisplayForexSymbol", () => {
  it("formats forex pairs for display", () => {
    expect(toDisplayForexSymbol("OANDA:EUR_USD")).toBe("EUR/USD");
    expect(toDisplayForexSymbol("EURUSD")).toBe("EUR/USD");
  });
});

describe("splitCompactForexSymbol", () => {
  it("splits common quote currencies", () => {
    expect(splitCompactForexSymbol("USDJPY")).toBe("USD/JPY");
  });
});
